import { Paragraph, Section } from '../apis/components/Common';

export default function Installation() {
  return (
    <Section title="Installation">
      <Paragraph>Install Mimic from your browser extension store:</Paragraph>
      <ul style={{ paddingLeft: '1.25rem', marginBottom: '1rem', color: '#334155' }}>
        <li style={{ marginBottom: '0.5rem' }}>
          Chrome:{' '}
          <a href="https://chromewebstore.google.com/detail/mimic/kpohfimcpcmbcihhpgnjcomihmcnfpna">
            https://chromewebstore.google.com/detail/mimic/kpohfimcpcmbcihhpgnjcomihmcnfpna
          </a>
        </li>
        <li style={{ marginBottom: '0.5rem' }}>
          Edge:{' '}
          <a href="https://microsoftedge.microsoft.com/addons/detail/mimic/ilcdijkgbkkllhojpgbiajmnbdiadppj">
            https://microsoftedge.microsoft.com/addons/detail/mimic/ilcdijkgbkkllhojpgbiajmnbdiadppj
          </a>
        </li>
      </ul>
      <Paragraph>After the first installation, restart your browser to ensure the extension initializes correctly.</Paragraph>
    </Section>
  );
}
