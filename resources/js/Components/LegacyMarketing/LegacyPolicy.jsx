import policies from './legal-content.json';
import '../../../css/legacy-policy.css';

// Published policy wording is preserved verbatim in its original language.
function Policy({ type }) {
    return <article className="legacy-policy" lang="en" dangerouslySetInnerHTML={{ __html: policies[type].html }} />;
}
export function TermsOfUse() { return <Policy type="terms" />; }
export function PrivacyPolicy() { return <Policy type="privacy" />; }
