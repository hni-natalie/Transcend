const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET } = require('../utils/secrets');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../../prisma/client');
const { logPresenceActivity } = require('../utils/activity');
const { uploadFile } = require('./supabase.service');

const JWT_EXPIRY = process.env.JWT_EXPIRY || '1d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const USER_INCLUDE = { role: true, department: true };

// re-download google avatar if the last sync is older than this
const AVATAR_SYNC_TTL_MS = 7 * 24 * 60 * 60 * 1000;

class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function signToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      roleId: user.roleId,
      roleName: user.role.roleName,
      workspaceId: user.workspaceId, 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function formatUserResponse(user, loginAt) {
  return {
    userId: user.userId,
    userName: user.userName,
    userEmail: user.userEmail,
    roleId: user.roleId,
    roleName: user.role.roleName,
    department: user.department,
    userStatus: user.userStatus,
    avatarUrl: user.avatarUrl || null,
    authProvider: user.authProvider || 'email',
    lastLoginAt: loginAt,
  };
}

async function finalizeLogin(user) {
  const loginAt = new Date();

  await prisma.user.update({
    where: { userId: user.userId },
    data: { lastLoginAt: loginAt },
  });

  const token = signToken(user);

  await logPresenceActivity({
    workspaceId: user.workspaceId,
    userId: user.userId,
    action: 'logged in',
  });

  return { token, user: formatUserResponse(user, loginAt) };
}

async function loginWithPassword(userEmail, userPassword) {
  const user = await prisma.user.findUnique({
    where: { userEmail },
    include: USER_INCLUDE,
  });

  if (!user) {
    throw new AuthError(401, 'Invalid email or password');
  }

  if (!user.userPassword) {
        throw new AuthError(401, 'Please login with Google');
  }

  const match = await bcrypt.compare(userPassword, user.userPassword);
  if (!match) {
    throw new AuthError(401, 'Invalid email or password');
  }

  return finalizeLogin(user);
}

// downloads google's hotlinked profile photo and re-hosts it on supabase,
// so clients never hit googleusercontent.com directly (was causing 429s)
async function syncGoogleAvatar(userId, googlePhotoUrl) {
  try {
    const res = await fetch(googlePhotoUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());
    const fileExt = contentType.split('/').pop();
    const filePath = `avatars/${userId}/${userId}-${Date.now()}.${fileExt}`;

    return await uploadFile(process.env.SUPABASE_PUBLIC_BUCKET, filePath, buffer, contentType);
  } catch (err) {
    console.error('Google avatar sync failed:', err);
    return null;
  }
}

async function verifyGoogleToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

async function loginWithGoogle(idToken) {
  let payload;
  try {
    payload = await verifyGoogleToken(idToken);
  } catch (err) {
    throw new AuthError(401, 'Invalid Google token');
  }

  const { sub: googleId, email: userEmail, picture: avatarUrl } = payload;

  let user = await prisma.user.findUnique({
    where: { userEmail },
    include: USER_INCLUDE,
  });

  if (!user) {
    throw new AuthError(401, 'No account found with this email. Please contact your administrator.');
  }

  if (!user.googleId) {
    // link google account
	const syncedAvatarUrl = avatarUrl ? await syncGoogleAvatar(user.userId, avatarUrl) : null;
    user = await prisma.user.update({
      where: { userId: user.userId },
      data: {
        googleId,
        authProvider: 'google',
        avatarUrl: syncedAvatarUrl || avatarUrl || user.avatarUrl,
        avatarSyncedAt: syncedAvatarUrl ? new Date() : undefined,
      },
      include: USER_INCLUDE,
    });
  } else if (user.googleId !== googleId) {
    // security: google id mismatch
    throw new AuthError(401, 'This email is linked to a different Google account.');
    } else if (
    avatarUrl &&
    (
      !user.avatarUrl ||
      user.avatarUrl.includes('googleusercontent.com') ||
      !user.avatarSyncedAt ||
      Date.now() - user.avatarSyncedAt.getTime() > AVATAR_SYNC_TTL_MS
    )
  ) {
    const syncedAvatarUrl = await syncGoogleAvatar(user.userId, avatarUrl);

    user = await prisma.user.update({
      where: { userId: user.userId },
      data: {
        avatarUrl: syncedAvatarUrl || avatarUrl,
        avatarSyncedAt: syncedAvatarUrl ? new Date() : undefined,
      },
      include: USER_INCLUDE,
    });
  }

  const result = await finalizeLogin(user);
  // google login defaults authProvider display to 'google' even on first-ever call
  result.user.authProvider = user.authProvider || 'google';
  return result;
}

async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      socketId: true,
      userId: true,
      userName: true,
      userEmail: true,
      workspaceId: true,
      roleId: true,
      role: { select: { roleName: true } },
      department: { select: { dpId: true, dpName: true } },
      userTitle: true,
      userStatus: true,
      avatarUrl: true,
      authProvider: true,
      createdAt: true,
      country: true,
      city: true,
      timezone: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    throw new AuthError(404, 'User not found');
  }

  return {
    socketId: user.socketId,
    workspaceId: user.workspaceId,
    userId: user.userId,
    userName: user.userName,
    userEmail: user.userEmail,
    roleId: user.roleId,
    role: { roleName: user.role.roleName },
    department: user.department,
    userTitle: user.userTitle,
    userStatus: user.userStatus,
    avatarUrl: user.avatarUrl ?? null,
    authProvider: user.authProvider ?? 'email',
    country: user.country ?? null,
    city: user.city ?? null,
    timezone: user.timezone ?? null,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

async function logout(userId, workspaceId) {
  await prisma.user.update({
    where: { userId },
    data: { userStatus: 'offline' },
  });

  await logPresenceActivity({
    workspaceId,
    userId,
    action: 'logged out',
  });

  const { getIO } = require('../services/socket.service');
  getIO().emit('user-status-changed', { userId, status: 'offline' });
}

module.exports = {
  AuthError,
  loginWithPassword,
  loginWithGoogle,
  getCurrentUser,
  logout,
};