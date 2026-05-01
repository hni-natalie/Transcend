import { LegalLayout } from '@features/legal/LegalLayout';

export const Terms = () => (
    <LegalLayout title="Terms & Conditions">
        <section>
            <h2 className="text-xl font-semibold text-white mb-4 font-mono">1. Usage</h2>
            <p>WorkFrom is a virtual workspace designed for collaboration. By using this service, you agree to...</p>
        </section>
        <section>
            <h2 className="text-xl font-semibold text-white mb-4 font-mono">2. Beta Disclaimer</h2>
            <p>This application is currently part of a technical project. The service is provided "as is".</p>
        </section>
    </LegalLayout>
);