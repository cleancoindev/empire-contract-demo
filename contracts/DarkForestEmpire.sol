//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.8;

import "@nomiclabs/buidler/console.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

import "./core/DarkForestCore.sol";

contract DarkForestEmpire {
    DarkForestCore gameContract;
    bool empireInitialized;

    // owner is allowed to add new players
    address owner;

    // authorized players are allowed to make moves
    mapping(address => bool) authorizedPlayers;

    modifier onlyOwner() {
        require(msg.sender == owner, "caller not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedPlayers[msg.sender], "caller not authorized");
        _;
    }

    // --------- Owner Only Function --------- \\
    function initialize(address _owner, address _gameContract) public {
        owner = _owner;
        empireInitialized = false;
        authorizedPlayers[_owner] = true;
        gameContract = DarkForestCore(_gameContract);
    }

    function addAuthorizedPlayer(address _player) public onlyOwner {
        authorizedPlayers[_player] = true;
    }

    function removeAuthorizedPlayer(address _player) public onlyOwner {
        require(_player != owner, "cant remove owner from authorized player");
        authorizedPlayers[_player] = false;
    }

    // ---------  Player Only Function --------- \\
    function initializePlayer(
        uint256[2] memory _a,
        uint256[2][2] memory _b,
        uint256[2] memory _c,
        uint256[3] memory _input
    ) public onlyAuthorized {
        require(!empireInitialized, "empire already initialized");
        gameContract.initializePlayer(_a, _b, _c, _input);
        empireInitialized = true;
    }

    function move(
        uint256[2] memory _a,
        uint256[2][2] memory _b,
        uint256[2] memory _c,
        uint256[7] memory _input
    ) public onlyAuthorized {
        require(empireInitialized, "empire have not been initialized");
        gameContract.move(_a, _b, _c, _input);
    }

    function upgradePlanet(uint256 _location, uint256 _branch)
        public
        onlyAuthorized
    {
        require(empireInitialized, "empire have not been initialized");
        gameContract.upgradePlanet(_location, _branch);
    }

    function refreshPlanet(uint256 _location) public {
        require(empireInitialized, "empire have not been initialized");
        gameContract.refreshPlanet(_location);
    }
}
