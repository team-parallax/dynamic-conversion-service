# `auto-scaler`
Dynamically start and stop docker-containers based on the number of pending requests.

## Preliminary Usage

```typescript
import AutoScaler from "."

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
const {
    containersToStart,
    pendingRequests,
    runningContainers
} = status
// TODO : autoScaler.applyConfigurationState

```
