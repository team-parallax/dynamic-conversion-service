# `auto-scaler`
Dynamically start and stop docker-containers based on the number of pending requests.

## Preliminary Usage

```
import AutoScaler from '.'

const autoScaler = new AutoScaler(
    {
        containerStartThreshold: 10,
        maxContainers: 50,
        dockerConfig: {
            containerLabel: "someLabel",
            imageId: "someImageId",
            socketPath: "socketPath"
        }
    }
)
// pass pending request count
const status = autoScaler.checkContainerStatus(10)
// e.g.
// status : {
//     containersToKill: 0,
//     containersToStart: 7,
//     pendingRequests: 10,
//     runningContainers: [3] -> 3 running containers
// }
// starts 7 containers
autoScaler.applyConfigurationState(status)

```
