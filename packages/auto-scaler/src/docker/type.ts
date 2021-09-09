/* https://github.com/moby/moby/blob/c858e496f670f3eb201f06a6b6cf5e2f4370687d/docs/api/v1.40.yaml#L4055 */
export type TDockerContainerStatus =
 "created"
 | "running"
 | "paused"
 | "restarting"
 | "removing"
 | "exited"
 | "dead"
 /* https://github.com/moby/moby/blob/c858e496f670f3eb201f06a6b6cf5e2f4370687d/docs/api/v1.40.yaml#L730 */
export type TDockerHealthStatus =
  "none"
  | "starting"
  | "healthy"
  | "unhealthy"