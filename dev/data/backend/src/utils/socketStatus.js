const { supabase } = require("../services/supabase.service.js");

const updateSocketId = async (socketId, userId, userStatus) => {
    const payload = { socketId };

    if (userStatus !== undefined) {
        payload.userStatus = userStatus;
    }

    const { data, error } = await supabase
        .from('User')
        .update(payload)
        .eq('userId', userId)
    if (error) {
        console.error('Error updating socketId: ', error);
    } else {
        console.log(`Socket ID ${socketId} stored in db for user ${userId}, status: `, userStatus);
    }
}
module.exports = { updateSocketId };
