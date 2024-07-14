// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.20;

/*______     __      __                              __      __ 
 /      \   /  |    /  |                            /  |    /  |
/$$$$$$  | _$$ |_   $$ |____    ______   _______   _$$ |_   $$/   _______ 
$$ |  $$ |/ $$   |  $$      \  /      \ /       \ / $$   |  /  | /       |
$$ |  $$ |$$$$$$/   $$$$$$$  |/$$$$$$  |$$$$$$$  |$$$$$$/   $$ |/$$$$$$$/ 
$$ |  $$ |  $$ | __ $$ |  $$ |$$    $$ |$$ |  $$ |  $$ | __ $$ |$$ |
$$ \__$$ |  $$ |/  |$$ |  $$ |$$$$$$$$/ $$ |  $$ |  $$ |/  |$$ |$$ \_____ 
$$    $$/   $$  $$/ $$ |  $$ |$$       |$$ |  $$ |  $$  $$/ $$ |$$       |
 $$$$$$/     $$$$/  $$/   $$/  $$$$$$$/ $$/   $$/    $$$$/  $$/  $$$$$$$/
*/
/**
 * @author Othentic Labs LTD.
 * @notice Terms of Service: https://www.othentic.xyz/terms-of-service
 */

import {Test, console} from "forge-std/Test.sol";
import {IAttestationCenter} from "../src/IAttestationCenter.sol";
import {UserScore} from "../src/UserScore.sol";

contract UserScoreTest is Test {
    UserScore userScore;
    address attestationCenter = makeAddr("attestationCenter");

    function setUp() public {
        userScore = new UserScore(attestationCenter);
    }

    function test_acl() public {
        vm.expectRevert("Not allowed");
        userScore.afterTaskSubmission(
            IAttestationCenter.TaskInfo("123456", hex"", makeAddr("performer"), 0),
            true,
            hex"",
            [uint(0), uint(0)],
            new uint[](0)
        );
    }

    function test_random() public {
        address performer = makeAddr("performer");
        address[] memory users = userScore.getUsers();

        uint256 numberOfUsersBefore = users.length;
        int256 scoreBefore = userScore.userScore(performer);

        vm.prank(attestationCenter);
        userScore.afterTaskSubmission(
            IAttestationCenter.TaskInfo("123456", hex"", performer, 0),
            true,
            hex"",
            [uint(0), uint(0)],
            new uint[](0)
        );

        uint256 numberOfUsersAfter = userScore.getUsers().length;

        assertEq(numberOfUsersBefore + 1, numberOfUsersAfter);
        assertEq(userScore.userScore(performer), scoreBefore + 1);
    }
}