import { LegalLayout } from '@features/legal/LegalLayout';

export const Terms = () => (
    <LegalLayout title="Terms & Conditions">
        <div className="space-y-8">
            
            <p className="text-xl text-foreground-3">
                Welcome to <strong>WorkFrom</strong>. <br/>
				Please read these Terms and Conditions carefully before using our virtual office collaboration platform.
            </p>

            <hr className="border-background-3" />

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">1. Acceptance of Terms</h2>
                <p className="text-lg text-foreground-3 leading-relaxed mb-3">
                    By accessing, signing up for, or using the WorkFrom application (the "Service"), you agree to be bound by these Terms and Conditions. If you are entering into these terms on behalf of a company or other legal entity, you represent that you have the authority to bind such entity to these terms.
                </p>
                <p className="text-lg text-foreground-3 leading-relaxed">
                    Your use of the Service is also governed by our <a href="/privacy" className="text-accent-lime hover:underline">Privacy Policy</a>, which describes how we collect, use, and protect your information, including chat messages, meeting recordings, and uploaded documents.
                </p>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">2. Description of Service</h2>
                <p className="text-lg  text-foreground-3 leading-relaxed mb-2">
                    WorkFrom provides a virtual office workspace that allows users to:
                </p>
                <ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-1 ml-4">
                    <li>Interact, move, and collaborate within virtual layout spaces.</li>
                    <li>Chat via direct or group messaging and share attachments (documents, images).</li>
                    <li>Conduct video/voice conferencing and record meetings (using LiveKit technology).</li>
                    <li>Assign tasks, manage departments, and upload organization documents.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">3. Accounts &amp; Security</h2>
                <ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-2 ml-4">
                    <li>
                        <strong>Registration:</strong> WorkFrom does not offer open self-registration. To use the Service, you must be invited or added to a workspace by an authorized workspace administrator. Once added, you will set up account access (either via Google Sign-In or by providing an email and password). You agree to provide accurate and complete account information.
                    </li>
                    <li>
                        <strong>Minimum Age:</strong> You must be at least 18 years old to create an account and use the Service. WorkFrom is designed for use by working professionals and businesses, and is not intended for individuals under the age of 18.
                    </li>
                    <li>
                        <strong>Credentials Security:</strong> You are solely responsible for maintaining the confidentiality of your account credentials and passwords. You must notify us immediately of any unauthorized use of your account.
                    </li>
                    <li>
                        <strong>Workspace Admin Controls:</strong> Workspace owners or administrators have control over workspace membership, department structure, and user roles.
                    </li>
                </ul>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">4. User Conduct &amp; Content Guidelines</h2>
                <p className="text-lg text-foreground-3 leading-relaxed mb-2">
                    By using WorkFrom, you agree that you will not upload, share, or transmit any content or use the service in a way that:
                </p>
                <ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-1 ml-4">
                    <li>Violates local, national, or international laws or regulations.</li>
                    <li>Infringes upon intellectual property rights, trademarks, or copyrights of others.</li>
                    <li>Transmits malware, viruses, or any harmful code.</li>
                    <li>Interferes with or disrupts the security or integrity of our real-time messaging, database, or meeting streaming infrastructure.</li>
                    <li>Uploads highly sensitive data (e.g., credit card numbers, social security details) into non-secure areas such as general chat channels or open documents.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">5. Intellectual Property &amp; License</h2>
                <ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-2 ml-4">
                    <li>
                        <strong>Service Ownership:</strong> All software, design, logos, graphics, and real-time infrastructure of WorkFrom remain the sole property of the service owners.
                    </li>
                    <li>
                        <strong>User Content License:</strong> You retain ownership of all text, documents, files, and meeting recordings you submit or store. However, by uploading content, you grant WorkFrom a worldwide, royalty-free license to host, store, process, transmit, and display that content solely for the purpose of providing the service to you and your workspace members.
                    </li>
                </ul>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">6. Beta Disclaimer (Limited Liability)</h2>
                <div className="text-lg bg-accent-lime-bg/30 border border-accent-lime rounded-lg p-4 text-accent-gold">
                    <p className="font-semibold mb-2">⚠️&nbsp;&nbsp;&nbsp;Warning</p>
                    <p className="text-foreground-3 leading-relaxed">
                        WorkFrom is currently provided as a project or "Beta" release.
                    </p>
                    <p className="text-lg text-foreground-3 leading-relaxed mt-2">
                        The service is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind. We do not guarantee uninterrupted, secure, or error-free operations. We are not liable for any data loss, service interruptions, or disclosure of communications.
                    </p>
                </div>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">7. Termination &amp; Account Deletion</h2>
                <ul className="text-lg list-disc list-inside text-foreground-3 leading-relaxed space-y-2 ml-4">
                    <li>
                        We reserve the right to suspend or terminate your access to the Service at any time, without prior notice, for conduct that violates these Terms or is harmful to other users or the service.
                    </li>
                    <li>
                        Users do not have the ability to self-terminate or delete their accounts directly within the app. Account termination and deletion within a workspace can be executed by an authorized superuser or workspace administrator.
                    </li>
                    <li>
                        <strong>Requesting Deletion:</strong> If you wish to delete your account or personal data and are unable to do so through your workspace administrator, you may contact us directly at <a href="mailto:support@workfrom.com" className="text-accent-lime hover:underline">support@workfrom.com</a>. We will process such requests within <strong>30</strong> business days, subject to any data retention obligations required by law or your workspace administrator's data policies.
                    </li>
                </ul>
            </section>

            <section>
                <h2 className="text-3xl font-semibold text-white mb-4 font-mono">8. Governing Law</h2>
                <p className="text-lg text-foreground-3 leading-relaxed">
                    These Terms shall be governed by and construed in accordance with the laws of <strong>the Republic of Singapore</strong>, without regard to its conflict of law principles, without prejudice to any mandatory consumer protection or data protection laws that may apply to you in your country of residence.
                </p>
            </section>
        </div>
    </LegalLayout>
);