import { Paragraph, Section } from '../apis/components/Common';

export default function QuickStart() {
  return (
    <Section title="Quick Start">
      <Paragraph>
        Open the Mimic extension sidebar. From the sidebar you can record task steps, replay them, and generate runnable scripts.
      </Paragraph>
      <Paragraph>
        For a guided walkthrough, watch the playlist:{' '}
        <a href="https://www.youtube.com/playlist?list=PLvU_JUL1nukuMO1qCllN19VDgO2t9pd9x">
          https://www.youtube.com/playlist?list=PLvU_JUL1nukuMO1qCllN19VDgO2t9pd9x
        </a>
      </Paragraph>
    </Section>
  );
}
