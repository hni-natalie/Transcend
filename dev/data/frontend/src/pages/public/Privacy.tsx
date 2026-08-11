import { LegalLayout } from '@features/legal/LegalLayout';

export const Privacy = () => (
    <LegalLayout title="Privacy Policy">
        <div className="space-y-8">
            
            <p className="text-xl text-foreground-3">
                Welcome to <strong>WorkFrom</strong>. <br/>
				We respect your privacy and are committed to protecting your personal data. This Privacy Policy describes how we collect, use, store, process, and protect your information when you use our virtual workspace collaboration platform.
            </p>

            <hr className="border-background-3" />

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">1. Information We Collect</h2>
                <p className="text-lg text-foreground-3 leading-relaxed mb-3">
                    Based on the technical structure of the WorkFrom platform, we collect the following types of information:
                </p>

				<div className="ml-14">
					<h3 className="text-2xl font-semibold text-white mb-2 font-mono">a. Personal Information You Provide</h3>
					<ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-1 ml-4 mb-4">
						<li>
							<strong>Account Data:</strong> WorkFrom does not offer open self-registration — you are added to a workspace by an authorized workspace administrator. When your account is created, we collect your <strong>email address</strong>, <strong>name</strong>, and <strong>hashed password</strong> (if using email/password authentication).
						</li>
						<li>
							<strong>Profile Information:</strong> You can customize your profile by providing an <strong>avatar image</strong>, <strong>city</strong>, <strong>country</strong>, and <strong>timezone</strong>.
						</li>
						<li>
							<strong>Single Sign-On (SSO):</strong> If you choose to log in using Google, we receive and store your Google user ID (<code>googleId</code>) and email address.
						</li>
					</ul>

					<h3 className="text-2xl font-semibold text-white mb-2 font-mono">b. Workspace &amp; Collaboration Data</h3>
					<ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-1 ml-4 mb-4">
						<li>
							<strong>Messages &amp; Chat Content:</strong> We store direct and group chat messages, call notes, and links shared within the system.
						</li>
						<li>
							<strong>File Attachments:</strong> When you upload files to chat sessions (PDFs, images, documents), they are uploaded and stored in our cloud storage service (Supabase Storage).
						</li>
						<li>
							<strong>Tasks &amp; Projects:</strong> We store titles, descriptions, assignments, priorities, and completion statuses of tasks created within your workspace.
						</li>
						{/* <li>
							<strong>Documents &amp; Knowledge Base:</strong> We process and store uploaded documents (such as meeting summaries) and generate semantic search embeddings of document content.
						</li> */}
					</ul>

					<h3 className="text-2xl font-semibold text-white mb-2 font-mono">b. Live Communication &amp; Meetings</h3>
					<ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-1 ml-4 mb-4">
						<li>
							<strong>Audio/Video Streaming (LiveKit):</strong> Real-time meetings, video conferencing, and voice rooms are powered by WebRTC. Audio/video streams are transmitted in real-time.
						</li>
						<li>
							<strong>Meeting Recordings:</strong> If a meeting host initiates a recording, the audio/video session is recorded, processed, and the resulting file URL is stored in our system.
						</li>
						<li>
							<strong>AI-Powered Transcription &amp; Summarization:</strong> When a meeting is recorded, we may process the audio using Faster Whisper Service to generate a text transcript, and may further process that transcript using an AI language model to produce a meeting summary. These generated transcripts and summaries are stored alongside the recording and are visible to authorized workspace members. This section will be updated once this feature is implemented and the specific provider is finalized.
						</li>
					</ul>

					<h3 className="text-2xl font-semibold text-white mb-2 font-mono">d. Technical, Activity &amp; Real-Time Data</h3>
					<ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-1 ml-4">
						<li>
							<strong>Presence &amp; Interaction Status:</strong> We track your real-time status (online, offline, focus, away, in meeting), socket identifiers, and virtual office layout coordinates/movement.
						</li>
						<li>
							<strong>Activity Logs:</strong> We log user activities categorized by type (presence, space navigation, task updates, meeting actions) along with timestamps for workspace administrators' audit logs.
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
                    <li>To manage user authentication, roles, and authorization.</li>
                    <li>To enable real-time messaging, video/voice conferencing, and document management.</li>
                    <li>To provide workspace administrators with activity logs and audit trails.</li>
                    <li>To calculate and display location-specific timezone and profile data to other members of your workspace.</li>
                </ul>
                <p className="text-lg text-foreground-3 leading-relaxed">
                    <strong>Legal Basis for Processing:</strong> We process your personal data primarily because it is necessary to perform our contract with you (i.e., to provide the Service you signed up for). Where applicable, we may also rely on your consent or our legitimate interests (such as maintaining security and preventing abuse).
                </p>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">3. Data Storage &amp; Security</h2>
                <ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-2 ml-4">
                    <li>
                        <strong>Database &amp; Storage Services:</strong> We store structured data using PostgreSQL (managed database via Prisma/Supabase) and files in object storage (Supabase Storage).
                    </li>
                    <li>
                        <strong>Data Storage Location:</strong> Your data is primarily stored on servers located in Singapore (Supabase <code>ap-southeast</code> region). If you are accessing the Service from outside Singapore, your data will be transferred to, stored, and processed in Singapore. By using the Service, you consent to this transfer. Where required by law (e.g., for users in the EU/UK), we take appropriate steps to ensure adequate protection for such transfers.
                    </li>
                    <li>
                        <strong>Passwords:</strong> Password security is enforced using cryptographic hashing algorithms (bcrypt).
                    </li>
                    <li>
                        <strong>Data Retention:</strong> We retain your account data and collaborative content (chats, tasks, documents) for as long as your workspace is active, or until you/your administrator requests deletion.
                    </li>
                    <li>
                        <strong>Data Breach Notification:</strong> In the event of a data breach that compromises your personal data, we will notify affected users without undue delay, and in any event within the timeframe required by applicable law (e.g., 72 hours under GDPR where applicable).
                    </li>
                </ul>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">4. How Your Information Is Shared</h2>
                <p className="text-lg text-foreground-3 leading-relaxed mb-2">
                    Your information is shared with other members of your workspace as follows:
                </p>
                <ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-2 ml-4">
                    <li>
                        <strong>Profile &amp; Status:</strong> Your name, avatar, timezone, city, country, and online presence status are visible to all members of your active workspace.
                    </li>
                    <li>
                        <strong>Workspace Content:</strong> Tasks, group messages, files, documents, and meetings are visible to authorized members of the workspace.
                    </li>
                    <li>
                        <strong>Third-Party Services:</strong> We share minimal necessary data with hosting and API infrastructure providers:
                        <ul className="text-lg list-disc list-inside ml-6 mt-1 space-y-1">
                            <li><strong>LiveKit:</strong> To coordinate audio/video connection tokens.</li>
                            <li><strong>Google OAuth:</strong> To authenticate your login credentials (if selected).</li>
                            <li><strong>Supabase:</strong> For database hosting, user metadata syncing, and file storage.</li>
                            <li><strong>Faster Whisper Service &amp; Google AI:</strong> To convert meeting recordings into text transcripts and summaries (see Section 1C).</li>
                        </ul>
                    </li>
                </ul>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">5. Your Rights and Control</h2>
                <p className="text-lg text-foreground-3 leading-relaxed mb-2">
                    Depending on your jurisdiction (such as under GDPR or CCPA), you may have rights including:
                </p>
                <ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-1 ml-4">
                    <li>
                        <strong>Access and Portability:</strong> Request a copy of your personal data.
                    </li>
                    <li>
                        <strong>Correction:</strong> Edit your name, profile info, and password at any time.
                    </li>
                    <li>
                        <strong>Deletion ("Right to be Forgotten"):</strong> Request deletion of your user account or specific documents and files by contacting us or your workspace administrator. Workspace administrators can also remove users from departments and workspaces.
                    </li>
                </ul>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">6. Intended Users</h2>
                <p className="text-lg text-foreground-3 leading-relaxed">
                    WorkFrom is designed for use by working professionals and businesses. The Service is not intended for individuals under the age of 18, and we do not knowingly collect personal data from minors.
                </p>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">7. Contact Us</h2>
                <p className="text-lg text-foreground-3 leading-relaxed">
                    For any questions about this Privacy Policy or to exercise your data rights, please contact us at <a href="mailto:support@workfrom.com" className="text-accent-lime hover:underline">support@workfrom.com</a>.
                </p>
            </section>
        </div>
    </LegalLayout>
);