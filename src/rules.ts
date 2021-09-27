type ForwardingRule = {
  target: string,
  key: string,
  match(request: Request): boolean,
};

export default [
  /**
   * Make forwarding rules here
   */
] as ForwardingRule[];
