import React from 'react';
import { GogogoUtils } from '../../utils/GogogoUtils';

interface PrepareExtensionProps {
  stepNumber: number;
}

const PrepareExtension: React.FC<PrepareExtensionProps> = ({ stepNumber }) => {
  const [isInstalled, setIsInstalled] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkIsInstalled = async () => {
      const installed = await GogogoUtils.isExtensionInstalled();
      setIsInstalled(installed);
    };

    const onReadyStateChange = () => {
      if (document.readyState === 'complete') {
        document.removeEventListener('readystatechange', onReadyStateChange);
        void checkIsInstalled();
      }
    };

    if (document.readyState === 'complete') {
      void checkIsInstalled();
    } else {
      document.addEventListener('readystatechange', onReadyStateChange);
    }

    return () => {
      document.removeEventListener('readystatechange', onReadyStateChange);
    };
  }, []);

  // Handle install extension button click
  const handleInstallExtension = () => {
    // Detect browser type
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome\//.test(userAgent) && !/Edg\//.test(userAgent);
    const isEdge = /Edg\//.test(userAgent);

    // Open extension installation interface based on browser
    let extensionUrl = '';
    if (isChrome) {
      extensionUrl = 'https://chromewebstore.google.com/detail/gogogo/kpohfimcpcmbcihhpgnjcomihmcnfpna';
    } else if (isEdge) {
      extensionUrl = 'https://microsoftedge.microsoft.com/addons/detail/gogogo/ilcdijkgbkkllhojpgbiajmnbdiadppj';
    } else {
      // Default to Chrome extension store for other browsers
      extensionUrl = 'https://chromewebstore.google.com/detail/gogogo/kpohfimcpcmbcihhpgnjcomihmcnfpna';
    }

    window.open(extensionUrl, '_blank');
  };

  return (
    <div className="workflow-step">
      <div className="step-header">
        <div className="step-number">{stepNumber}</div>
        <h2 className="step-title">Prepare</h2>
      </div>
      <div className="step-content">
        <button className="install-btn" onClick={handleInstallExtension} disabled={isInstalled === true}>
          {isInstalled === true ? 'Extension installed' : 'Install extension'}
        </button>
        <p className="step-description">Click the button above to install the required browser extension.</p>
      </div>
    </div>
  );
};

export default PrepareExtension;
