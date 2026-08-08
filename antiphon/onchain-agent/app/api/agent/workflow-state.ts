/**
 * Per-request workflow guards for AgentA and SDG tool loops.
 */

export type AgentaWorkflowState = {
  discovered: boolean;
  paidTaskSucceeded: boolean;
  checkCanRatePassed: boolean;
};

export type SdgWorkflowState = {
  searchCount: number;
};

export type TurnWorkflowState = {
  agentSlug: string;
  agenta: AgentaWorkflowState;
  sdg: SdgWorkflowState;
};

export function createTurnWorkflowState(agentSlug: string): TurnWorkflowState {
  return {
    agentSlug,
    agenta: {
      discovered: false,
      paidTaskSucceeded: false,
      checkCanRatePassed: false,
    },
    sdg: { searchCount: 0 },
  };
}

export const PAID_X402_TOOLS = new Set([
  "paidStoreFile",
  "paidRetrieveFile",
  "invokeX402Route",
  "X402ActionProvider_retry_http_request_with_x402",
  "X402ActionProvider_make_http_request_with_x402",
  "request_onchain_service",
]);
