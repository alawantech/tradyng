declare module 'node-fetch' {
  function fetch(url: string, options?: any): Promise<any>;
  export default fetch;
}
