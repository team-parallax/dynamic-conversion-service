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
//     containersToRemove: 0,
//     containersToStart: 7,
//     pendingRequests: 10,
//     runningContainers: [3] -> 3 running containers
// }
// starts 7 containers
autoScaler.applyConfigurationState(status)
// If there are idle containers that need to be removed
// you need to pass them to applyConfigurationState
// e.g.
// status : {
//     containersToRemove: 3,
//     containersToStart: 0,
//     pendingRequests: 0,
//     runningContainers: [3] -> 3 running containers
// }
autoScaler.applyConfigurationState(status, ["id1", "id2", "id3"])
```

## `checkContainerStatus(pendingRequests: number): IContainerStatus`
This function reports the number of running containers, pending requests
and the number of containers to start/remove. 
The result can be passed to `applyConfigurationState`.

## `applyConfigurationState(status: IContainerStatus, idleContainerIds: []): IContainerInfo[]`
This function starts/removes the number of specified containers within 
the status object. If containers need to be removed, the ID's of these containers
must be provided via the `idleContainerIds` parameter.  
The return value is an array of started/removed container infos containing 
their label and id.