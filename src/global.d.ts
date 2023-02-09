declare const acquireVsCodeApi: () => {
  postMessage: ({ command: stringify, text: string }) => void;
};
