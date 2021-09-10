# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.2.0-14](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/compare/v0.2.0-13...v0.2.0-14) (2021-09-10)

## [0.2.0-13](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/compare/v0.2.0-12...v0.2.0-13) (2021-09-10)


### Bug Fixes

* **ci:** add default pipeline image ([bca37e6](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/bca37e60dfb3e71278cd9eb6535c90d84e926e8f))

## [0.2.0-12](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/compare/v0.2.0-11...v0.2.0-12) (2021-09-10)

## [0.2.0-11](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/compare/v0.2.0-10...v0.2.0-11) (2021-09-10)

## [0.2.0-10](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/compare/v0.2.0-9...v0.2.0-10) (2021-09-10)

## [0.2.0-9](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/compare/v0.2.0-8...v0.2.0-9) (2021-09-10)


### Bug Fixes

* **root:** fix invalid yaml ([77218ef](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/77218efd0cd9b8c3306b123e3541d55298e05638))
* **root:** move image definition in ci-file ([8eb016c](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/8eb016cdf0b6d6924b0883c9d064cfdc9930ed76))

## [0.2.0-8](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/compare/v0.2.0-7...v0.2.0-8) (2021-09-10)


### Bug Fixes

* **root:** fix invalid yaml definition for ci ([eae7ce9](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/eae7ce9f4f36c9d3f46fe8fb959c18677b80380e))

## [0.2.0-7](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/compare/v0.2.0-6...v0.2.0-7) (2021-09-10)


### Features

* **auto-scaler:** start/remove containers in parallel ([3123f09](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/3123f09fa59bd9e36fe3d7c4cdab446c7e37873e))
* **auto-scaler:** use literal type for container (health-)status ([c0f077d](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/c0f077ded1662041cc06aa3b25841f96f34e20a7)), closes [#115](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/115)
* **logger:** remove quotes from log messages ([daba7fe](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/daba7fe6148ef97479d574b2f56dd8cdcf38acf9)), closes [#91](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/91)
* **multiple:** change docker connection strategy ([3a4e9bd](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/3a4e9bdaa4dcaa627c38a7f9494be933fb0f3418))
* **redis:** add function to remove request files ([37318a4](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/37318a4e0c4c5709bc574ea15f7cd46e73861957)), closes [#131](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/131)
* **redis:** add new config setting for FILE_TTL ([5bea05e](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/5bea05e67b5fa072adf59742ec712573246fc9e3)), closes [#127](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/127)
* **redis:** check for file ttl ([bfe4d77](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/bfe4d77791ecd9ed5b0b9dadad81415d9f60a25b)), closes [#127](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/127)
* **redis:** dispatch to healthy workers and treat starting as unhealthy ([b3aa1b1](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/b3aa1b13a29ed562a17fb8d8d7625e4736f9ee47)), closes [#118](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/118)
* **redis:** initial version of the WorkerManager ([50e0426](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/50e0426241249e7e16174d86dc4ea9d3178249ce))
* **redis:** lower default interval values ([94a76ba](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/94a76bae4269dc4e67ff8d869a914e287e704acb)), closes [#128](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/128)
* **redis:** make redis-server options optional ([8e7619b](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/8e7619b898f0752d67b24ccb631ad67281065bab)), closes [#128](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/128)
* **redis:** moved worker communication to WorkerManager ([a9062ca](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/a9062cad8870314959c2249d36f65d033701e9cd))
* **redis:** only dispatch 1 request to a worker per interval ([69d79e7](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/69d79e70a8083cbcacc1ab0da612e2154f3fd585)), closes [#120](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/120)
* **redis:** ping redis-server on launch ([e88096d](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/e88096dc0f75cf74006c71d6aaa19e995328ea28)), closes [#121](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/121)
* **redis:** remove untracked containers with given name prefix ([4202455](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/4202455c5863414acc1141a0dfa1ed03366f4714)), closes [#122](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/122)
* **redis:** reply pong to ping if at least one worker is up ([9ec081a](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/9ec081a3bfdd5d2d848a47805a569aa9613495d2))
* **redis:** simplify WorkerHandler.fetchFiles ([7d82a38](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/7d82a38b45cf4106cd7c2bb02bfd3c32130bed9e)), closes [#131](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/131)
* **redis:** wip: dockerize redis implementation ([cbd0689](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/cbd06899ce0440369c03ef23b489eea458b50570))


### Bug Fixes

* **multiple:** identify and remove idle containers correctly ([193851a](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/193851ac4006e616bf187fd0c4cbdb66a2dde34f)), closes [#119](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/119)
* **redis:** add missing function-parameter ([eb4085e](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/eb4085e3dd1cb6b3c70f97c309feb3d7eb67ca66))
* **redis:** add timeout to redis-wrapper init function ([6ff75a6](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/6ff75a6a54ee570b7f6ae7d7a21c55516485d8d7))
* **redis:** fix wrong logging in redis-wrapper ([7ef2df8](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/7ef2df8f0246ee7df871f30a8e67ff2d3dc4dfcb)), closes [#125](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/125)
* **redis:** only apply state in state interval ([b4475dc](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/b4475dcfcb4c467e4eddb2253839a8fd63265bc9))
* **redis:** track requests which are still in queue ([e1ded1c](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/e1ded1c7f8271d5f2c5ecf824c966842decbc0f2)), closes [#130](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/130)


### Reverts

* **redis:** remove broken signal handlers ([61df38d](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/61df38d08f9dfa27305a267b3f7de8f6b16032a0))


### Docs

* **redis:** add usage section for dynamic-conversion-service ([6f23928](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/6f239286bc6a0f9899f5b2e4c3919fd4425d8654))


### Tests

* **auto-scaler:** fix broken auto-scaler unit test ([cbbc1f8](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/cbbc1f8b564082f251d2f095dcbe30685c4ee478))
* **redis:** add missing tests to WorkerHandler ([37cddd8](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/37cddd8bfa2c254223340b7e3ab8210d101832b3))
* **redis:** fix broken envConfig test ([2861700](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/28617006d09be85f78bb1d21c919a223fdb5aef9))
* **redis:** fix broken util unit test ([1023d3b](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/1023d3b4f9096edf38b09dc0a342f309dfbd4c45))
* **redis:** fix broken util unit tests ([e301500](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/e301500c7889ce9c3c57f30806ce7d4b90aea923))
* **redis:** fix broken workerWrapper unit test ([223f30f](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/223f30f9e34ea6fea63c61b2d1c798462a0945b2))
* **redis:** remove wrong test-case ([3129709](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/3129709c33384f548d09d5669947d70780fb0f7f))

## [0.2.0-6](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/compare/v0.2.0-1...v0.2.0-6) (2021-09-06)


### ⚠ BREAKING CHANGES

* **multiple:** Different configuration values. CONTAINER_LABEL was removed. CONTAINER_NAME_PREFIX
was added.
* **auto-scaler:** added non-optional config parameter
* **auto-scaler:** Added `idleContainerIds` parameter to `applyConfigurationState`

### Features

* **auto-scaler:** add containerStatus to IContainerInfo ([32895fe](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/32895fe778a0a4d48dd5cc9c5b78ed55b0bc858b))
* **auto-scaler:** add currentConversionInfo to IContainerInfo ([bfce1bc](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/bfce1bc01e969410412cc1d895879a92660122ff)), closes [#71](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/71)
* **auto-scaler:** add custom error for invalid docker connect options ([a872e6e](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/a872e6ee250707f5a7ad0a707e064cfd5a1c9661)), closes [#48](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/48)
* **auto-scaler:** add host/port options for docker config ([99b09c2](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/99b09c2c6fc9b0d265d2206f8886cbb51f3545b6)), closes [#48](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/48)
* **auto-scaler:** add logger to auto-scaler ([d4fb1ea](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/d4fb1ea630eb20826bc9588f63b88bda5b5d1abd)), closes [#37](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/37)
* **auto-scaler:** add option for minimum number of containers ([71dd6ee](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/71dd6ee75e6886b5bda427c04bb9aa9183d59239))
* **auto-scaler:** add optional env vars to docker config ([d3fb04e](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/d3fb04ed7ba56c3f6bc7e4086035f8e49d04c953)), closes [#95](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/95)
* **auto-scaler:** add optional tag param to applyConfigurationState ([ae2fa41](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/ae2fa41246d4a26cf4abd1829bc7888300f36c55)), closes [#56](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/56)
* **auto-scaler:** add optional tag param to checkImage ([29c918a](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/29c918a5feaff3b4530a7ce6b4b9e34ee9ce82b0))
* **auto-scaler:** add optional tag to docker config ([40e8133](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/40e81335895870b65a658e6d18f2616c9095a807)), closes [#55](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/55)
* **auto-scaler:** check for local image before pulling ([25b22a4](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/25b22a478799c85212fdefcfe40d4a73bbd74a95)), closes [#94](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/94)
* **auto-scaler:** expose removeContainer by function in auto-scaler ([6624427](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/6624427c90d608b79275503f2bf24163a7114a76)), closes [#75](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/75)
* **auto-scaler:** extract container IP on create ([8d2c1e4](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/8d2c1e46668c1a053f58254975dfe254639c6798))
* **auto-scaler:** pull image if not locally available ([53814d4](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/53814d479b7a6b907b9aaf8a7e6d52f1d23729e9))
* **auto-scaler:** refactor 'applyConfigurationState' return type ([19489f8](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/19489f8628bcaed0386a9894a7ea79e34b18810a)), closes [#63](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/63)
* **conversion-service:** add healthcheck to docker container ([cc08dd0](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/cc08dd0aeba147ec5f655668225cd3a1abc0376f))
* **logger:** add possibility to change serviceName ([93d3203](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/93d3203f3fb5e6b3ff1be99bc9181542eca59204)), closes [#73](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/73)
* **logger:** add separator between meta info and message ([18333ef](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/18333ef3876821ccb2da4b2c196f58cf69888b32))
* **logger:** create logger package ([461fb90](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/461fb908a5f1f0f0257efbfe70eda0ab462df256)), closes [#47](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/47)
* **logger:** create logger package ([7fb8cf4](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/7fb8cf41767928f4aab01845efa428998f25471c)), closes [#47](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/47)
* **multiple:** add IWorkerInfo interface ([c7fb6eb](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/c7fb6eb2a7991895b0857cce1b28e95307b6daae)), closes [#50](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/50)
* **multiple:** add IWorkerInfo interface ([a32cfc7](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/a32cfc75eb8a74a3bb7b80511a2996358ef8fb76)), closes [#50](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/50)
* **redis:** add 'getPendingRequestCount' function ([d457a15](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/d457a15282ec1bde3f0845333be04706da28546f))
* **redis:** add 'getPendingRequestCount' function ([73559ce](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/73559ce8d7a4cb3fcf37659729b2cd08445f41fa))
* **redis:** add 'updateWorkerConversionstatus' function ([46e5483](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/46e54834a2ccdf4e1c4d50db85cf59370e09eb34))
* **redis:** add api ([5790573](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/5790573f5e20d6a8d5e575455a4ac4550f91108d))
* **redis:** add conversion-service env vars ([e613179](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/e613179539dd6ccf6e79d1a950fc7eeb16034177)), closes [#95](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/95)
* **redis:** add conversionStatus to IConversionRequest ([05ad502](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/05ad502d7fc90e4b5b10750b2022ebc3ea5c8c03))
* **redis:** add conversionStatus to IConversionRequest ([72e871a](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/72e871a63916115ec4fe3ac61bffe9247dbd8dd3))
* **redis:** add developement index file ([b2f970b](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/b2f970bab384edf2698566f9aa53a7d2caa70a66))
* **redis:** add fetch funcs, restructure interval ([745b1f3](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/745b1f3ecbd127ea9c85e6f1797d08599f062f4d))
* **redis:** add functions to check if a containerStatus is healthy ([00c1570](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/00c15708dd3b45ccd9936a83470acca2395427e3))
* **redis:** add functions to push and pop requests into/from the queue ([ca630b8](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/ca630b816609f3c273069d2d17c3b0d4b71eb069)), closes [#68](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/68)
* **redis:** add functions to push and pop requests into/from the queue ([9314941](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/93149410c8a0d074b82e5ff321b67d7c2d168c43)), closes [#68](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/68)
* **redis:** add getIdleWorkerIDs function ([1656d16](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/1656d164af854dbf038a962c7876ed8ea0878a72))
* **redis:** adjust way to get idle workers ([4b9d9c0](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/4b9d9c08d43904d93b8e58450e715930417b37c6))
* **redis:** correctly compute remaining conversions ([02583e1](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/02583e139cf57b4c9320ad6630125eda1d55c738))
* **redis:** enable graceful shutdown ([f15d40f](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/f15d40f42f4dfc679c16751ac5a603f4cac28577))
* **redis:** export api and add script ([234ab33](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/234ab3386c6e71d271673cbea3893c545cd458d7))
* **redis:** extend redis api ([cad0ec6](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/cad0ec68dd06b8e8ef44313b162300d4acd5f332))
* **redis:** extract more infos from docker api ([dd07fd9](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/dd07fd97322e0bb2c6a86529a3e440c861dc1057)), closes [#111](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/111) [#99](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/99) [#117](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/117)
* **redis:** further implement worker communication ([bc7a3d9](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/bc7a3d9b1d1954d3426928f903348bdb6b22257c)), closes [#85](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/85) [#82](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/82)
* **redis:** implement getConversionQueueStatus ([1c77474](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/1c77474e8a1baa57a833b26ed455dc4c8183f3db))
* **redis:** implement ping to see if any worker is running ([a36c863](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/a36c863ae55d2a68525f813f8631c7ddcc2b1a7d)), closes [#97](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/97)
* **redis:** implement proxied format retrieval ([e505e1a](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/e505e1a6738604264eefeafe3c8a390b787b6260)), closes [#78](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/78)
* **redis:** inject RedisService as singleton via IOC ([1a96547](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/1a965472a88743ee200a91431ed51610811fbc03))
* **redis:** measure duration of interval ([974fbe3](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/974fbe362e62a4ddd985c341e3896c1f43f3f2a1))
* **redis:** preliminary implement 'pingWorker' ([0f6a9dc](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/0f6a9dcb6aea433111653a28e1882f696f4bd14d)), closes [#97](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/97)
* **redis:** preliminary implementation of getConvertedFile/Download ([61e0848](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/61e084872ef0d8addbf2d4d7d11732c7652e59d3))
* **redis:** push incoming conversion request into queue ([2825ab2](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/2825ab2919f0f9d6710cfd61a333ee585311ba54))
* **redis:** remove containers on SIGINT ([17a6547](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/17a6547a783905fe9804aef8f0b5d16cfcbc373e))
* **redis:** remove containers which are not responding ([2a6e818](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/2a6e818892e59007c0623a55767cb0c83f9548b2))
* **redis:** respect TASKS_PER_CONTAINER setting ([1471fb4](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/1471fb40bfb6209f6b7cb9e311c85f3b0c29d42b)), closes [#106](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/106)
* **redis:** run auto-scaler healthcheck on launch ([9114715](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/9114715fa649b838ff8d5a3b633dd0eb9324117c))
* **redis:** run queue and health check in intervals ([29a9a0f](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/29a9a0fe6784d4242d15b0e7f5770b3c9ca7d214))
* **redis:** shorten http logging ([c15431f](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/c15431fbe6b9219934c049db7709c67f42def2eb))
* **redis:** update running workers map with state change result ([26b7281](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/26b728122a5e3475ab23efc4d3604c5cfdbdb704)), closes [#70](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/70)
* **redis:** use container health check instead of ping ([5de70f4](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/5de70f43323758421c37c61ed608d62a162988f6)), closes [#103](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/103)
* **redis:** validate auto-scaler on config load ([85788ce](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/85788ce4a8b6f78b8460e752cc8eca37c542d08b)), closes [#62](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/62)
* **redis-service:** add 'getPendingMessagesCount' to redis-wrapper, adjust behaviour ([8983e9f](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/8983e9f75364aee9ed164f1a3047a851938467e5)), closes [#58](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/58)
* **redis-service:** add 'popMessage' function ([e89b102](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/e89b1022fa7c5116a2f09f807f03b8db446e89ff))
* **redis-service:** add custom redis-wrapper wrappers ([0b6bf63](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/0b6bf6386644d66df906fdd19880d7ca62aa3cbc))
* **redis-service:** add function to load config from .env ([25ed3aa](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/25ed3aa96c7ba94a582b38718c257eae81ec8906))
* **redis-service:** add initial version with auto-scaler ([2e6b1a8](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/2e6b1a83f95f0fc11223d1562e42a0bc9268aa72))
* **redis-service:** add logging ([86438e0](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/86438e02a811c8dc4b8a0d4fe7526f33eee49afa)), closes [#54](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/54)
* **redis-service:** add redis-service PoC ([883efc3](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/883efc330e2694d063342aad1e4203997b4c139d)), closes [#18](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/18)
* **redis-service:** load redis config from env, add custom errors ([1f06b85](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/1f06b85a5e91d2baefb3303bfc0709718684d459))


### Bug Fixes

* **auto-scaler:** avoid div by zero, negative values ([80f891b](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/80f891b600ee385f74eede6bd05e82ae1c007212))
* **auto-scaler:** catch potential error when probing for ip ([7042644](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/7042644fd145a597d3736c5cc50985393f9f6423)), closes [#99](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/99)
* **auto-scaler:** create/remove containers sequentially ([96262f7](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/96262f752293e62e29edb37b4221494ff32b3310))
* **auto-scaler:** fix auto-scaler not starting min-containers on launch ([4573220](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/4573220d7feb142ec78ea560e94d4906c08bbb90)), closes [#92](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/92)
* **auto-scaler:** fix decision logic ([421c5b8](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/421c5b85bb7344f763b5a228c7ee818dedebf1d0))
* **auto-scaler:** fix issues when removing containers ([54df8eb](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/54df8ebab19bbee6318cdbcb17d8132ad3a465e3)), closes [#22](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/22)
* **auto-scaler:** fix listing and creating of containers ([d566003](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/d566003ed6355c83a86eff4558f4d62974d68f63)), closes [#22](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/22)
* **auto-scaler:** fix name not being retrieved correctly on remove ([eff50c0](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/eff50c0ad03b2677e090393efa1a1bc849104e80))
* **auto-scaler:** prevent containers from exiting immediately ([b6e9795](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/b6e9795380674e52fc665d02c985cab751931667))
* **auto-scaler:** refactor/fix auto-scaler ([3296525](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/3296525455f933c0a7c3b427b4ef25363a204bb6)), closes [#22](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/22)
* **ci-configuration:** fix wrong needs-dependency ([1142c5d](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/1142c5dc2fbab60efdf008fdc8c59ccd485d7403))
* **conversion-service:** fix docker setup to run locally ([8ef1e07](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/8ef1e07a56ce348a0565239dec2cf30570599ab3))
* **logger:** fix error when using logger w/o parameters ([1be763d](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/1be763d7b6ba77a8acded9790118853eda8c9dc5)), closes [#86](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/86)
* **multiple:** use name prefix to identity containers instead of label ([50f8920](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/50f89202339699ef3a81e6bab94196168517320b)), closes [#74](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/74)
* **redis:** add 'start-dev' script ([9844322](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/9844322f172bdffdf1cd50c4b3bef95753d04071))
* **redis:** add missing file which got lost in rebase ([5c78ed7](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/5c78ed7cdd77f468218dd520fa9d960fce6810bb))
* **redis:** fix async/await anti-pattern ([540b7de](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/540b7de9f82daa77d2217876c2fa84698c8327aa)), closes [#110](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/110)
* **redis:** fix failing test ([45d48d2](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/45d48d22f021cbcd274986b6cd0944596d506221))
* **redis:** fix failing test ([2fa1005](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/2fa10054b6c1f085df279e2ad44d240684d41e93))
* **redis:** fix file extension extraction ([5281ad1](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/5281ad1923170d92cf90b0b8972d01c2e31e0ffc)), closes [#113](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/113)
* **redis:** fix getConversionResult using wrong conversion id ([f0d6c0f](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/f0d6c0f7804c57a85620f3b438ce5a97cf111920))
* **redis:** fix various bugs ([89d1d65](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/89d1d653825482896b50d8559171ba69a3012fee))
* **redis:** fix wrong log output in health check ([4b5e4ed](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/4b5e4ed098d8ebf1c19c07778db5335e29d98947))
* **redis:** remove existing queues on launch ([f543d3e](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/f543d3e97129f711f7bc219cb9b94da3adb83845)), closes [#93](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/93)
* **redis:** use correct RegisterRoutes function ([cbc814f](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/cbc814f42c4c78c729db7fb76bac5e84678c7274)), closes [#89](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/89)
* **redis-service:** fix isNumber check, fix wrong env variable key ([48ba60d](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/48ba60dd7c790d255be1c6170b1751c445488b72))
* **redis-service:** improve error handling ([0335e5a](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/0335e5adc42a83a962e1781fa73a34fa2cc4b63d))


### Reverts

* **redis:** undo lint related commits ([b7e92fe](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/b7e92fe31aa18eb53a5b3ef8f6a18601653339cb)), closes [#104](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/104)


### Tests

* **auto-scaler:** add beforeAll/afterAll to test suite ([f699737](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/f6997371f9a8ea1b10110f6b8c33854bb35e2d20))
* **auto-scaler:** add more tests ([6de5952](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/6de5952cdf0e6e435afd8b4f022dcbde5cfe95b1))
* **auto-scaler:** add tests ([f6afc81](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/f6afc817124cc15ad18ce00ac1a062ad6eeb19f2)), closes [#22](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/22)
* **auto-scaler:** add tests for `computeContainerScaleAmount` ([7f929ea](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/7f929eaae4ae31be355ce06ac7b52dcb16a2a8b0))
* **auto-scaler:** add tests for container removal ([6a1038d](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/6a1038daae78396b2acbb944283e4538a7415f16))
* **auto-scaler:** fix zeroing of array ([234f33d](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/234f33d58f98fcdb1454e04fb1259f7aabca9a82))
* **conversion-service:** add 'app.dev.ts' to conversion-service ([203b356](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/203b356fda4681bfc2c031fcd5fc2995b6ae0798))
* **dynamic-conversion-service:** increase jest timout only in auto-scaler ([4ec1848](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/4ec18489da29a43af2c048423699968f0ea89366))
* **redis:** add missing env variables for tests ([8c38198](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/8c38198a95987009ab08be00f14fa3ff1b7b16fd))
* **redis:** add tests for utility functions ([521fa9d](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/521fa9d74ea6f95493ab8baf216870d2afada2c5))
* **redis:** exclude generated from api from test coverage ([ded00fd](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/ded00fd17032f097b9ee06007fa883a2b3fabdd1)), closes [#79](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/79)
* **redis:** exclude generated from api from test coverage ([b4e5755](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/b4e57554a4f3fa50bd27415ec23864514803de81)), closes [#79](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/79)
* **redis:** fix invalid jest config for coverage ([b73d44e](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/b73d44e2142b596ca392dfce42042fc4b5b86cd6)), closes [#83](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/83)
* **redis:** fix invalid jest config for coverage ([8cb47d4](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/8cb47d47b9f4912d7f16d2371e3eac490b535fbb)), closes [#83](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/83)
* **redis-service:** add missing test file ([1ec600d](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/1ec600d4637249b30161fbc8da0e943a89d77f53))
* **redis-service:** add more test cases ([db9684c](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/db9684c5513db2d88185904fc014e491ace71dd9))
* **redis-service:** add stricter number check, simplify env config testing ([438dc55](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/438dc5506bc460d9654994c8fa4cdab6e1f1dbf7))
* **redis-service:** add tests ([f80dfa8](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/f80dfa8bde87b3798d1efa941c4c43e9cd2f6529))
* **redis-service:** add tests for config loading ([091596e](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/091596ec5b906e103985fc3fd7194531268a2ac9)), closes [#58](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/58)
* **redis-service:** fix test naming ([72d5598](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/72d5598b0c7db3b405e1b9972954381aaed02fe7)), closes [#53](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/53)
* **redis-service:** use await/expect/resolves in redisService test ([b8f558f](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/b8f558f18974678dd687cbf07e8e6f883e8e5b45))
* **redis-service:** use await/resolves in tests ([9c17ea7](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/9c17ea79b8590c85bf82d821092b6446fcded4fc))


### Docs

* **auto-scaler:** adjust/extend README ([1edaf62](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/1edaf62f48a3abc4c20f749a992a0e16e921e9e8)), closes [#22](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/22) [#15](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/15)
* **auto-scaler:** remove unnecessary jsdoc ([a15b65a](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/a15b65a250c7ccb43790db82667000d241748694))
* **auto-scaler:** update README ([f300603](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/f3006032b0f406d9ec5b3968bf91d7d78c4fb66c))
* **conversion-service:** fix wrong image name ([b0edfe7](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/b0edfe76e21760abe9b1d802b0945186349b1206)), closes [#84](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/84)
* **conversion-service:** fix wrong image name ([5acb25d](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/5acb25dd87a605d62e594883c17ac8b8e7007b03)), closes [#84](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/84)
* **readme:** add links for logger and redis packages ([7299053](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/72990531934e177239b6a52213349d07518d91b8))
* **readme:** add links for logger and redis packages ([7d0baa5](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/7d0baa56bae0eab12d1c99c869660e244e651bae))
* **redis:** add docker-compose section to readme ([7b78af0](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/7b78af0ffac24a17724f9c4942405c12d9526a1a)), closes [#57](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/57)
* **redis:** add jsdoc to redis service ([2b9a739](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/2b9a739a1def384ff871b7cf12736be34e9ee26a))
* **redis:** add missing jsdoc ([c853995](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/c853995c2f00a47306a4bef6f9cec857d56d82ad))
* **redis:** update code doc ([732e92c](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/732e92cc7b1d9fdb4799adae71f677058dac91cc))

## [0.2.0-5](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/compare/v0.2.0-4...v0.2.0-5) (2021-08-06)

## [0.2.0-4](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/compare/v0.2.0-3...v0.2.0-4) (2021-08-06)


### Bug Fixes

* **ci-configuration:** fix erroneous before_script ([40f9595](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/40f9595f2dc48af08408cf3e2dbeb90cfbcf35ba))

## [0.2.0-3](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/compare/v0.2.0-1...v0.2.0-3) (2021-08-06)


### Bug Fixes

* **ci-configuration:** fix wrong needs-dependency ([1142c5d](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/1142c5dc2fbab60efdf008fdc8c59ccd485d7403))

## 0.2.0-1 (2021-08-06)


### Features

* **redis:** add redis package to mono-repo ([bd81859](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/bd81859f75198e5c6934e3cd616a014ff6b389ed)), closes [#42](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/42)


### Bug Fixes

* **.gitlab-ci.yml:** fix invalid ci definition ([8c6ef16](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/8c6ef1637d90416529fc29a0410ce36961cd05b7))
* **ci-configuration:** fix invalid dependency ([3f6204c](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/3f6204ce5d5cafe090c1a1b578c0281615ea9caf))
* **conversion-service:** add return statement in controller ([1716776](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/171677603a0450a973fa278d91a8e1d7d32035ba))
* **conversion-service:** fix dangling comma in package.json ([bfd621b](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/bfd621bac560f4e8fd08e93be2a12e83a5050812))
* **package.json:** add missing script for tests with coverage ([bad51b5](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/bad51b51fdd1d48be965723365942a80edd757ae))


### Code Refactoring

* **auto-scaler:** rename variables, remove unnecessary comment ([2dfa96f](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/2dfa96fad900dafb366b708ebf401691e93eb676))
* **conversion-service:** remove unused code(-comments) ([f1570b7](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/f1570b7b824f7c9e15a0d141165c9c2d02bb56b4))
* **eslint-configuration:** fix eslint configuration ([d6cc853](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/d6cc8533f2ada6313b83896da64f149a54368653)), closes [#26](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/26)


### Docs

* **auto-scaler:** add preliminary documentation ([5feab0c](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/5feab0cb930bcbb890394aee15abb6c1a675694b)), closes [#15](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/issues/15)
* **auto-scaler:** add syntax-highlighting in docs ([9b67ef1](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/9b67ef18cff5eb3c9f0b4c67ccf56693c7ccae66))
* **readme:** add project readme ([b3a8faa](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/b3a8faa5de7a859b07f4979fd87344c1eb9d9ed2))


### Styling

* **auto-scaler:** double-quotes instead of single-quotes ([0cd7b18](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/0cd7b180a5e63cf27393f13005ea0f968e73ca06))
* **auto-scaler:** fix destructing order and formatting ([8ccdd4e](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/8ccdd4e3ed9dcabbd91ec580f4493794dcd29cc8))
* **auto-scaler:** fix eslint violations ([ddcd8ba](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/ddcd8bab68ab7a0f3b82713069ac40dc7d183fc7))
* **auto-scaler:** fix eslint violations, fix review suggestions ([e9cba63](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/e9cba63865fa3293e26ecf501b6bba791c90b89c))
* **redis-tests:** add empty export ([04a9b39](https://gitlab.internal.team-parallax.com/belwue/dynamic-conversion-service/commit/04a9b39e10b9970694a220f825afbeca950bf8db))
