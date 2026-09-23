import { LegalLayout } from '@features/legal/LegalLayout';

export const Privacy = () => (
    <LegalLayout title="Privacy Policy" lastUpdated="September 23, 2026">
        <div className="space-y-8">
            
            <p className="text-xl text-foreground-3">
                Welcome to <strong>WorkFrom</strong>. <br/>
				We respect your privacy and are committed to protecting your personal data in accordance with applicable data protection laws, including the General Data Protection Regulation (GDPR). This Privacy Policy describes how we collect, use, store, process, and protect your information when you use our virtual workspace collaboration platform.
            </p>

            <hr className="border-background-3" />

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">1. Information We Collect</h2>
                <p className="text-lg text-foreground-3 leading-relaxed mb-3">
                    Based on the technical structure of the WorkFrom platform, we collect and process the following types of information:
                </p>

				<div className="ml-14">
					<h3 className="text-2xl font-semibold text-white mb-2 font-mono">a. Personal Information You Provide</h3>
					<ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-1 ml-4 mb-4">
						<li>
							<strong>Account Data:</strong> WorkFrom does not offer open self-registration — you are added to a workspace by an authorized workspace administrator. When your account is created, we collect your <strong>email address</strong>, <strong>full name</strong>, <strong>user role</strong>, <strong>department</strong>, and <strong>hashed password</strong> (if using email/password authentication) or temporary credentials assigned during account creation or password recovery.
						</li>
						<li>
							<strong>Profile Information:</strong> You can customize your profile by providing an <strong>avatar image</strong>, <strong>city</strong>, <strong>country</strong>, and <strong>timezone</strong>.
						</li>
						<li>
							<strong>Single Sign-On (SSO):</strong> If you choose to log in using Google, we receive and store your Google user ID (<code>googleId</code>) and verified email address.
						</li>
					</ul>

					<h3 className="text-2xl font-semibold text-white mb-2 font-mono">b. Workspace &amp; Collaboration Data</h3>
					<ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-1 ml-4 mb-4">
						<li>
							<strong>Messages &amp; Chat Content:</strong> We store direct and group chat messages, call notes, and links shared within the system.
						</li>
						<li>
							<strong>File Attachments:</strong> When you upload files to chat sessions (PDFs, images, documents), they are uploaded and stored in our cloud storage service (Supabase Storage). Attachments are bound to your user account and are purged upon account erasure.
						</li>
						<li>
							<strong>Tasks &amp; Projects:</strong> We store titles, descriptions, assignments, priorities, and completion statuses of tasks created within your workspace.
						</li>
					</ul>

					<h3 className="text-2xl font-semibold text-white mb-2 font-mono">c. Live Communication &amp; Meetings</h3>
					<ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-1 ml-4 mb-4">
						<li>
							<strong>Audio/Video Streaming (LiveKit):</strong> Real-time meetings, video conferencing, and voice rooms are powered by WebRTC. Audio/video streams are transmitted in real-time.
						</li>
						<li>
							<strong>Meeting Recordings:</strong> If a meeting host initiates a recording, the audio/video session is recorded, processed, and the resulting file URL is stored in our system.
						</li>
						<li>
							<strong>AI-Powered Transcription &amp; Summarization:</strong> When a meeting is recorded, we may process the audio using Faster Whisper Service to generate a text transcript, and may further process that transcript using an AI language model to produce a meeting summary. These generated transcripts and summaries are stored alongside the recording and are visible to authorized workspace members.
						</li>
					</ul>

					<h3 className="text-2xl font-semibold text-white mb-2 font-mono">d. Technical, Activity &amp; GDPR Audit Data</h3>
					<ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-1 ml-4">
						<li>
							<strong>Presence &amp; Interaction Status:</strong> We track your real-time status (online, offline, focus, away, in meeting), socket identifiers, and virtual office layout coordinates/movement.
						</li>
						<li>
							<strong>Activity Logs:</strong> We log user activities categorized by type (presence, space navigation, task updates, meeting actions) along with timestamps for workspace administrators' audit logs.
						</li>
						<li>
							<strong>Privacy &amp; GDPR Compliance Logs:</strong> We record timestamps of data export requests and account deletion requests to maintain audit trails of regulatory compliance.
						</li>
					</ul>
				</div>
			</section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">2. How We Use Your Data</h2>
                <p className="text-lg text-foreground-3 leading-relaxed mb-2">
                    We process your data for the following purposes:
                </p>
                <ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-1 ml-4 mb-3">
                    <li>To provide, operate, and maintain the virtual office collaboration features.</li>
                    <li>To manage user authentication, authorization, role privileges, and account security.</li>
                    <li>To handle password reset and recovery requests initiated by users through support.</li>
                    <li>To enable real-time messaging, video/voice conferencing, and document management.</li>
                    <li>To fulfill data subject requests under GDPR, including personal data exports and account erasure requests.</li>
                    <li>To calculate and display location-specific timezone and profile data to other members of your workspace.</li>
                </ul>
                <p className="text-lg text-foreground-3 leading-relaxed">
                    <strong>Legal Basis for Processing:</strong> We process your personal data primarily because it is necessary to perform our contract with you (i.e., to provide the Service you signed up for). Where applicable, we also rely on our legitimate interests (such as maintaining platform security, preventing abuse, and ensuring conversation integrity) or our legal obligations (such as GDPR compliance record-keeping).
                </p>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">3. Data Storage, Security &amp; Retention</h2>
                <ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-2 ml-4">
                    <li>
                        <strong>Database &amp; Storage Services:</strong> We store structured data using PostgreSQL (managed database via Prisma/Supabase) and files in object storage (Supabase Storage).
                    </li>
                    <li>
                        <strong>Data Storage Location:</strong> Your data is primarily stored on servers located in Singapore (Supabase <code>ap-southeast</code> region). If you are accessing the Service from outside Singapore, your data will be transferred to, stored, and processed in Singapore. Where required by applicable data protection laws (including GDPR), we implement appropriate safeguards for international data transfers.
                    </li>
                    <li>
                        <strong>Passwords &amp; Authentication Security:</strong> Passwords are cryptographically hashed using salted bcrypt before storage. When temporary passwords are generated during administrator resets, users are required to replace them with their own secure passwords immediately upon authentication.
                    </li>
                    <li>
                        <strong>Data Retention &amp; Erasure:</strong> We retain your account data and collaborative content for as long as your workspace account remains active. Upon receiving an account deletion request via the app or email, all personal identity data and file attachments are permanently erased within 30 days.
                    </li>
                    <li>
                        <strong>Data Breach Notification:</strong> In the event of a data security breach that compromises personal data, we will notify affected users without undue delay, and within the 72-hour notification window where mandated under GDPR.
                    </li>
                </ul>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">4. How Your Information Is Shared</h2>
                <p className="text-lg text-foreground-3 leading-relaxed mb-2">
                    Your information is shared within your workspace and with service providers as follows:
                </p>
                <ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-2 ml-4">
                    <li>
                        <strong>Profile &amp; Status:</strong> Your name, avatar, timezone, city, country, and online presence status are visible to members of your active workspace.
                    </li>
                    <li>
                        <strong>Workspace Content:</strong> Tasks, group messages, files, documents, and meetings are visible to authorized members of the workspace.
                    </li>
                    <li>
                        <strong>Third-Party Services:</strong> We share minimal necessary data with hosting and API infrastructure providers:
                        <ul className="text-lg list-disc list-inside ml-6 mt-1 space-y-1">
                            <li><strong>LiveKit:</strong> To coordinate audio/video connection tokens and WebRTC streaming.</li>
                            <li><strong>Google OAuth:</strong> To verify your Google login identity (if selected).</li>
                            <li><strong>Supabase:</strong> For database hosting, user metadata storage, and file storage.</li>
                            <li><strong>Faster Whisper Service &amp; Google AI:</strong> To convert meeting recordings into text transcripts and summaries.</li>
                        </ul>
                    </li>
                </ul>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">5. Your Rights and GDPR Controls</h2>
                <p className="text-lg text-foreground-3 leading-relaxed mb-3">
                    Under the General Data Protection Regulation (GDPR) and related data protection laws, you are entitled to exercise the following privacy rights:
                </p>
                <div className="ml-6 space-y-3 text-lg text-foreground-3 leading-relaxed">
                    <p>
                        <strong>a. Right of Access &amp; Data Portability (Self-Service Data Export):</strong> You can request and download a complete, machine-readable JSON copy of your personal data at any time via <strong>Settings &gt; Privacy and Data</strong> (<em>"Request My Data"</em>). The export includes your profile details, workspace activity logs, created/assigned tasks, organized/attended meetings, sent messages, and attachments metadata. An email confirmation is also dispatched upon request generation.
                    </p>
                    <p>
                        <strong>b. Right to Rectification (Correction):</strong> You can update and edit your personal information (name, city, country, timezone, avatar image) and update your password directly at any time in your account <strong>Settings</strong>.
                    </p>
                    <p>
                        <strong>c. Right to Erasure ("Right to be Forgotten"):</strong> You can submit an account deletion request directly from <strong>Settings &gt; Privacy and Data</strong> (<em>"Request to Delete My Account"</em>) or by emailing <a href="mailto:support@workfrom.com" className="text-accent-lime hover:underline">support@workfrom.com</a>. Upon administrative processing (within 30 days):
                    </p>
                    <ul className="list-disc list-inside ml-8 space-y-1">
                        <li>Your personal credentials (email, name, password hash, Google SSO identifier, location, and avatar) are permanently scrubbed and replaced with anonymous placeholders.</li>
                        <li>Uploaded message attachments and stored avatar files are permanently deleted from cloud object storage.</li>
                        <li>Tasks created by you are purged, and your name is de-associated from past meeting participation records.</li>
                        <li>Historical chat messages are retained in anonymized form (attributed to <em>"Deleted User"</em>) to prevent disruption of workspace communication channels.</li>
                        <li>Your active sessions are terminated immediately, and a deletion confirmation email is sent to your registered address.</li>
                    </ul>
                    <p>
                        <strong>d. Password Reset &amp; Account Recovery Flow:</strong> If you forget your password, you can initiate a reset by clicking <em>"Forgot Password"</em> on the login page to contact support (<a href="mailto:support@workfrom.com" className="text-accent-lime hover:underline">support@workfrom.com</a>). An administrator will reset your account to a temporary mock password. Once logged in with this temporary password, you must promptly navigate to account <strong>Settings</strong> to reset and choose your own secure password.
                    </p>
                </div>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">6. Intended Users</h2>
                <p className="text-lg text-foreground-3 leading-relaxed">
                    WorkFrom is designed for use by working professionals and businesses. The Service is not intended for individuals under the age of 18, and we do not knowingly collect personal data from minors.
                </p>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">7. Contact Us &amp; Data Protection Requests</h2>
                <p className="text-lg text-foreground-3 leading-relaxed">
                    For any questions regarding this Privacy Policy, password recovery support, or to exercise your GDPR data protection rights, please contact our privacy and support team at <a href="mailto:support@workfrom.com" className="text-accent-lime hover:underline">support@workfrom.com</a>.
                </p>
            </section>
        </div>
    </LegalLayout>
);