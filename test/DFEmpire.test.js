const { web3 } = require("@openzeppelin/test-environment");
const { time, expectEvent } = require("@openzeppelin/test-helpers");

const {
    DarkForestCore,
    Whitelist,
    Verifier,
    DarkForestEmpire,
    DarkForestPlanet,
    DarkForestLazyUpdate,
    DarkForestUtils,
    DarkForestTypes,
    DarkForestInitialize,
    getPlanetIdFromHex,
    asteroid1Location,
    asteroid2Location,
    highLevelLocation,
    makeInitArgs,
    makeMoveArgs,
    deployer,
    user1,
    user2,
    SMALL_INTERVAL,
    LARGE_INTERVAL,
} = require("./DFTestUtils");

describe("DarkForestEmpire", function () {
    before(async function () {
        // start deploying library contract
        this.verifierLib = await Verifier.new({ from: deployer });
        this.dfPlanetLib = await DarkForestPlanet.new({ from: deployer });
        this.dfLazyUpdateLib = await DarkForestLazyUpdate.new({
            from: deployer,
        });
        this.dfTypesLib = await DarkForestTypes.new({ from: deployer });
        this.dfUtilsLib = await DarkForestUtils.new({ from: deployer });
        this.dfInitializeLib = await DarkForestInitialize.new({
            from: deployer,
        });

        // start deploying whitelist contract
        await Whitelist.detectNetwork();
        this.whitelistContract = await Whitelist.new({ from: deployer });
        await this.whitelistContract.initialize(deployer, false);
    });

    beforeEach(async function () {
        // start deploying core
        await DarkForestCore.detectNetwork();
        await DarkForestCore.link("Verifier", this.verifierLib.address);
        await DarkForestCore.link("DarkForestPlanet", this.dfPlanetLib.address);
        await DarkForestCore.link(
            "DarkForestLazyUpdate",
            this.dfLazyUpdateLib.address
        );
        await DarkForestCore.link("DarkForestTypes", this.dfTypesLib.address);
        await DarkForestCore.link("DarkForestUtils", this.dfUtilsLib.address);
        await DarkForestCore.link(
            "DarkForestInitialize",
            this.dfInitializeLib.address
        );
        this.coreContract = await DarkForestCore.new({ from: deployer });
        await this.coreContract.initialize(
            deployer,
            this.whitelistContract.address,
            true
        );

        // start deploying empire contract
        await DarkForestEmpire.detectNetwork();
        this.empireContract = await DarkForestEmpire.new({ from: deployer });

        await this.empireContract.initialize(
            deployer,
            this.coreContract.address
        );
    });

    it("should proxy initialize player", async function () {
        let initialPlanetId = getPlanetIdFromHex(asteroid1Location.hex);

        const receipt = await this.empireContract.initializePlayer(
            ...makeInitArgs(initialPlanetId, 17, 2000),
            {
                from: deployer,
            }
        );

        await expectEvent.inTransaction(
            receipt.tx,
            DarkForestCore,
            "PlayerInitialized",
            (eventArgs = {
                player: this.empireContract.address,
                loc: initialPlanetId.toString(),
            })
        );
    });

    it("should proxy move", async function () {
        let initialPlanetId = getPlanetIdFromHex(asteroid1Location.hex);

        // initialize empire first
        await this.empireContract.initializePlayer(
            ...makeInitArgs(initialPlanetId, 17, 2000),
            {
                from: deployer,
            }
        );

        // perform move
        const newPlanetId = getPlanetIdFromHex(asteroid2Location.hex);
        const dist = 100;
        const shipsSent = 50000;
        const silverSent = 0;
        const receipt = await this.empireContract.move(
            ...makeMoveArgs(
                initialPlanetId,
                newPlanetId,
                16,
                2000,
                dist,
                shipsSent,
                silverSent
            ),
            { from: deployer }
        );

        await expectEvent.inTransaction(
            receipt.tx,
            DarkForestCore,
            "ArrivalQueued",
            (eventArgs = {
                arrivalId: web3.utils.toBN(0),
            })
        );
    });

    it("should proxy planet upgrade", async function () {
        const initialPlanetId = getPlanetIdFromHex(asteroid1Location.hex);
        const upgradeablePlanetId = getPlanetIdFromHex(highLevelLocation.hex);
        const dist = 0;
        const shipsSent = 250000;
        const silverSent = 0;

        await this.empireContract.initializePlayer(
            ...makeInitArgs(initialPlanetId, 17, 2000),
            {
                from: deployer,
            }
        );

        for (let i = 0; i < 4; i++) {
            time.increase(LARGE_INTERVAL);
            time.advanceBlock();

            await this.empireContract.move(
                ...makeMoveArgs(
                    initialPlanetId,
                    upgradeablePlanetId,
                    16,
                    2000,
                    dist,
                    shipsSent,
                    silverSent
                ),
                { from: deployer }
            );
        }

        time.increase(LARGE_INTERVAL);
        time.advanceBlock();

        this.empireContract.refreshPlanet(upgradeablePlanetId);

        const receipt = await this.empireContract.upgradePlanet(
            upgradeablePlanetId,
            0,
            {
                from: deployer,
            }
        );

        expectEvent.inTransaction(
            receipt,
            DarkForestCore,
            "PlanetUpgraded",
            (eventArgs = { loc: upgradeablePlanetId })
        );
    });
});
