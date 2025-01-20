
import { ContentDispatcher } from "./content/ContentDispatcher";

const timestamp = () => new Date().toISOString().replace(/T/, '-').replace(/:/g, '-').split('.')[0] + '-' + Date.now() % 1000;
console.log(`${timestamp()} content:: start`);

const dispatcher = new ContentDispatcher();


declare global {
  interface Window {
    contentGlobal: {
      isInjected: boolean;
      dispatcher: ContentDispatcher;
    };
  }
}

window.contentGlobal = {
  isInjected: true,
  dispatcher: dispatcher
};

console.log(`${timestamp()} content:: end`);