//SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ISemaphore} from "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import {ISemaphoreGroups} from "@semaphore-protocol/contracts/interfaces/ISemaphoreGroups.sol";

contract ZkHeriloom3 {
    // semaphore scroll sepolia address:0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D
    ISemaphore public semaphore;
    uint256 public groupCounter;
    address public admin;

    constructor(address _semaphoreAddress) {
        semaphore = ISemaphore(_semaphoreAddress);
        admin = msg.sender;
    }

    struct Inheritance {
        address owner;
        address successor;
        string ipfsHash;
        string tag;
        string fileName;
        uint256 fileSize;
        uint256 timestamp;
        bool isActive;
        bool isClaimed;
        uint256 parentInheritanceId; // ID of parent inheritance (0 if original)
        uint256 generationLevel; // How many times it has been passed down
    }

    struct UserDatabase {
        uint256 vaultID;
        uint256 index;
        uint256 identityCommitment;
        uint256 merkleTreeRoot;
    }

    // Mapping from user address to their database struct
    mapping(address => UserDatabase) public userDatabase;

    // Mapping from vault ID to array of user addresses in that vault
    mapping(uint256 => address[]) public vaultUsers;

    // Mapping from inheritance ID to Inheritance struct
    mapping(uint256 => Inheritance) public inheritances;

    // Mapping from owner address to their inheritance IDs
    mapping(address => uint256[]) public ownerInheritances;

    // Mapping from successor address to inheritance IDs they will inherit
    mapping(address => uint256[]) public successorInheritances;

    // Mapping from parent inheritance ID to child inheritance IDs (for tree structure)
    mapping(uint256 => uint256[]) public inheritanceChildren;

    // Mapping from IPFS hash to all inheritance IDs using that asset
    mapping(string => uint256[]) public ipfsHashToInheritances;

    // Counter for inheritance IDs
    uint256 public inheritanceCounter;

    // vault IDs created in semaphore.
    uint256[] public vaultIds;

    // Custom errors
    error NotAdmin();
    error InvalidSuccessorAddress();
    error CannotSetSelfAsSuccessor();
    error EmptyIpfsHash();
    error EmptyTag();
    error EmptyFileName();
    error InheritanceNotActive();
    error InheritanceAlreadyClaimed();
    error OnlySuccessorCanClaim();
    error OnlyOwnerOrSuccessorCanPassDown();
    error OnlyOwnerCanRevoke();
    error InheritanceAlreadyRevoked();
    error CannotRevokeClaimedInheritance();
    error OnlyOwnerCanUpdate();
    error CannotUpdateClaimedInheritance();
    error OnlyOwnerCanDelete();
    error CannotDeleteClaimedInheritance();

    //Only Admin Guard.
    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    event ChangeAdmin(address _newAdmin);

    event InheritanceCreated(
        uint256 indexed inheritanceId,
        address indexed owner,
        address indexed successor,
        string ipfsHash,
        string tag,
        uint256 parentInheritanceId,
        uint256 generationLevel
    );

    event InheritanceClaimed(
        uint256 indexed inheritanceId,
        address indexed successor
    );

    event InheritanceRevoked(
        uint256 indexed inheritanceId,
        address indexed owner
    );

    event SuccessorUpdated(
        uint256 indexed inheritanceId,
        address indexed oldSuccessor,
        address indexed newSuccessor
    );

    event InheritanceDeleted(
        uint256 indexed inheritanceId,
        address indexed owner
    );

    event InheritancePassedDown(
        uint256 indexed originalInheritanceId,
        uint256 indexed newInheritanceId,
        address indexed newSuccessor,
        uint256 generationLevel
    );

    /****** Functions to Manage Inheritances *****/

    /**
     * @dev Create a new inheritance record
     * @param _successor Address of the successor who will inherit
     * @param _ipfsHash IPFS hash of the encrypted file
     * @param _tag Category tag for the inheritance
     * @param _fileName Name of the file
     * @param _fileSize Size of the file in bytes
     */
    function createInheritance(
        address _successor,
        string memory _ipfsHash,
        string memory _tag,
        string memory _fileName,
        uint256 _fileSize
    ) external returns (uint256) {
        if (_successor == address(0)) revert InvalidSuccessorAddress();
        if (_successor == msg.sender) revert CannotSetSelfAsSuccessor();
        if (bytes(_ipfsHash).length == 0) revert EmptyIpfsHash();
        if (bytes(_tag).length == 0) revert EmptyTag();
        if (bytes(_fileName).length == 0) revert EmptyFileName();

				uint256 vaultId = semaphore.createGroup();
        vaultIds.push(vaultId);
        userDatabase[msg.sender] = UserDatabase({
            vaultID: vaultId,
            index: 0,
            identityCommitment: 0,
            merkleTreeRoot: 0
        });

        uint256 inheritanceId = inheritanceCounter++;

        inheritances[inheritanceId] = Inheritance({
            owner: msg.sender,
            successor: _successor,
            ipfsHash: _ipfsHash,
            tag: _tag,
            fileName: _fileName,
            fileSize: _fileSize,
            timestamp: block.timestamp,
            isActive: true,
            isClaimed: false,
            parentInheritanceId: 0,
            generationLevel: 0
        });

        ownerInheritances[msg.sender].push(inheritanceId);
        successorInheritances[_successor].push(inheritanceId);
        ipfsHashToInheritances[_ipfsHash].push(inheritanceId);

        emit InheritanceCreated(
            inheritanceId,
            msg.sender,
            _successor,
            _ipfsHash,
            _tag,
            0,
            0
        );

        return inheritanceId;
    }

    /**
     * @dev Claim an inheritance (callable by successor)
     * @param _inheritanceId ID of the inheritance to claim
     */
    function claimInheritance(uint256 _inheritanceId) external {
        Inheritance storage inheritance = inheritances[_inheritanceId];

        if (!inheritance.isActive) revert InheritanceNotActive();
        if (inheritance.isClaimed) revert InheritanceAlreadyClaimed();
        if (msg.sender != inheritance.successor) revert OnlySuccessorCanClaim();

        inheritance.isClaimed = true;
        inheritance.owner = msg.sender; // Transfer ownership

        emit InheritanceClaimed(_inheritanceId, msg.sender);
    }

    /**
     * @dev Pass down an inheritance to a new successor (callable by current owner or successor)
     * @param _inheritanceId ID of the inheritance to pass down
     * @param _newSuccessor Address of the new successor
     */
    function passDownInheritance(
        uint256 _inheritanceId,
        address _newSuccessor
    ) external returns (uint256) {
        Inheritance storage originalInheritance = inheritances[_inheritanceId];

        if (!originalInheritance.isActive) revert InheritanceNotActive();
        if (
            msg.sender != originalInheritance.owner &&
            msg.sender != originalInheritance.successor
        ) revert OnlyOwnerOrSuccessorCanPassDown();
        if (_newSuccessor == address(0)) revert InvalidSuccessorAddress();
        if (_newSuccessor == msg.sender) revert CannotSetSelfAsSuccessor();

        // Create new inheritance record with same asset
        uint256 newInheritanceId = inheritanceCounter++;

        inheritances[newInheritanceId] = Inheritance({
            owner: msg.sender,
            successor: _newSuccessor,
            ipfsHash: originalInheritance.ipfsHash,
            tag: originalInheritance.tag,
            fileName: originalInheritance.fileName,
            fileSize: originalInheritance.fileSize,
            timestamp: block.timestamp,
            isActive: true,
            isClaimed: false,
            parentInheritanceId: _inheritanceId,
            generationLevel: originalInheritance.generationLevel + 1
        });

        ownerInheritances[msg.sender].push(newInheritanceId);
        successorInheritances[_newSuccessor].push(newInheritanceId);
        ipfsHashToInheritances[originalInheritance.ipfsHash].push(
            newInheritanceId
        );
        inheritanceChildren[_inheritanceId].push(newInheritanceId);

        emit InheritancePassedDown(
            _inheritanceId,
            newInheritanceId,
            _newSuccessor,
            originalInheritance.generationLevel + 1
        );

        emit InheritanceCreated(
            newInheritanceId,
            msg.sender,
            _newSuccessor,
            originalInheritance.ipfsHash,
            originalInheritance.tag,
            _inheritanceId,
            originalInheritance.generationLevel + 1
        );

        return newInheritanceId;
    }

    /**
     * @dev Revoke an inheritance (callable by owner)
     * @param _inheritanceId ID of the inheritance to revoke
     */
    function revokeInheritance(uint256 _inheritanceId) external {
        Inheritance storage inheritance = inheritances[_inheritanceId];

        if (msg.sender != inheritance.owner) revert OnlyOwnerCanRevoke();
        if (!inheritance.isActive) revert InheritanceAlreadyRevoked();
        if (inheritance.isClaimed) revert CannotRevokeClaimedInheritance();

        inheritance.isActive = false;

        emit InheritanceRevoked(_inheritanceId, msg.sender);
    }

    /**
     * @dev Update the successor of an inheritance
     * @param _inheritanceId ID of the inheritance
     * @param _newSuccessor New successor address
     */
    function updateSuccessor(
        uint256 _inheritanceId,
        address _newSuccessor
    ) external {
        Inheritance storage inheritance = inheritances[_inheritanceId];

        if (msg.sender != inheritance.owner) revert OnlyOwnerCanUpdate();
        if (!inheritance.isActive) revert InheritanceNotActive();
        if (inheritance.isClaimed) revert CannotUpdateClaimedInheritance();
        if (_newSuccessor == address(0)) revert InvalidSuccessorAddress();
        if (_newSuccessor == msg.sender) revert CannotSetSelfAsSuccessor();

        address oldSuccessor = inheritance.successor;
        inheritance.successor = _newSuccessor;

        // Update successor mappings
        successorInheritances[_newSuccessor].push(_inheritanceId);

        emit SuccessorUpdated(_inheritanceId, oldSuccessor, _newSuccessor);
    }

    /**
     * @dev Permanently delete an inheritance (callable by owner)
     * @param _inheritanceId ID of the inheritance to delete
     */
    function deleteInheritance(uint256 _inheritanceId) external {
        Inheritance storage inheritance = inheritances[_inheritanceId];

        if (msg.sender != inheritance.owner) revert OnlyOwnerCanDelete();
        if (inheritance.isClaimed) revert CannotDeleteClaimedInheritance();

        // Mark as deleted by setting all fields to zero/false
        delete inheritances[_inheritanceId];

        emit InheritanceDeleted(_inheritanceId, msg.sender);
    }

    /**
     * @dev Get inheritance details
     * @param _inheritanceId ID of the inheritance
     */
    function getInheritance(
        uint256 _inheritanceId
    )
        external
        view
        returns (
            address owner,
            address successor,
            string memory ipfsHash,
            string memory tag,
            string memory fileName,
            uint256 fileSize,
            uint256 timestamp,
            bool isActive,
            bool isClaimed,
            uint256 parentInheritanceId,
            uint256 generationLevel
        )
    {
        Inheritance memory inheritance = inheritances[_inheritanceId];
        return (
            inheritance.owner,
            inheritance.successor,
            inheritance.ipfsHash,
            inheritance.tag,
            inheritance.fileName,
            inheritance.fileSize,
            inheritance.timestamp,
            inheritance.isActive,
            inheritance.isClaimed,
            inheritance.parentInheritanceId,
            inheritance.generationLevel
        );
    }

    /**
     * @dev Get the complete inheritance chain (from root to current)
     * @param _inheritanceId ID of the inheritance
     * @return chain Array of inheritance IDs in the chain
     */
    function getInheritanceChain(
        uint256 _inheritanceId
    ) external view returns (uint256[] memory chain) {
        // First, count the chain length
        uint256 length = 1;
        uint256 currentId = _inheritanceId;

        while (inheritances[currentId].parentInheritanceId != 0) {
            currentId = inheritances[currentId].parentInheritanceId;
            length++;
        }

        // Build the chain array (from root to current)
        chain = new uint256[](length);
        currentId = _inheritanceId;

        for (uint256 i = length; i > 0; i--) {
            chain[i - 1] = currentId;
            currentId = inheritances[currentId].parentInheritanceId;
        }

        return chain;
    }

    /**
     * @dev Get all child inheritances for a given inheritance ID
     * @param _inheritanceId ID of the parent inheritance
     * @return Array of child inheritance IDs
     */
    function getInheritanceChildren(
        uint256 _inheritanceId
    ) external view returns (uint256[] memory) {
        return inheritanceChildren[_inheritanceId];
    }

    /**
     * @dev Get all inheritances for a specific IPFS hash (asset tracking)
     * @param _ipfsHash IPFS hash of the asset
     * @return Array of inheritance IDs using this asset
     */
    function getInheritancesByIpfsHash(
        string memory _ipfsHash
    ) external view returns (uint256[] memory) {
        return ipfsHashToInheritances[_ipfsHash];
    }

    /**
     * @dev Get the root inheritance ID for any inheritance in the chain
     * @param _inheritanceId ID of any inheritance in the chain
     * @return Root inheritance ID
     */
    function getRootInheritance(
        uint256 _inheritanceId
    ) external view returns (uint256) {
        uint256 currentId = _inheritanceId;

        while (inheritances[currentId].parentInheritanceId != 0) {
            currentId = inheritances[currentId].parentInheritanceId;
        }

        return currentId;
    }

    /**
     * @dev Get all inheritance IDs for an owner
     * @param _owner Address of the owner
     */
    function getOwnerInheritances(
        address _owner
    ) external view returns (uint256[] memory) {
        return ownerInheritances[_owner];
    }

    /**
     * @dev Get all inheritance IDs where address is successor
     * @param _successor Address of the successor
     */
    function getSuccessorInheritances(
        address _successor
    ) external view returns (uint256[] memory) {
        return successorInheritances[_successor];
    }

    /**
     * @dev Check if an address can access an inheritance
     * @param _inheritanceId ID of the inheritance
     * @param _user Address to check
     */
    function canAccessInheritance(
        uint256 _inheritanceId,
        address _user
    ) external view returns (bool) {
        Inheritance memory inheritance = inheritances[_inheritanceId];

        // Owner can always access
        if (_user == inheritance.owner) {
            return true;
        }

        // Successor can access if inheritance is active
        if (_user == inheritance.successor && inheritance.isActive) {
            return true;
        }

        return false;
    }

    /**
     * @dev Get active inheritances count for an owner
     * @param _owner Address of the owner
     */
    function getActiveInheritancesCount(
        address _owner
    ) external view returns (uint256) {
        uint256[] memory ids = ownerInheritances[_owner];
        uint256 count = 0;

        for (uint256 i = 0; i < ids.length; i++) {
            if (inheritances[ids[i]].isActive) {
                count++;
            }
        }

        return count;
    }

    /****** Functions to Manage Vaults *****/

    // Add member to a vault.
    // For now anyone can add members, so the user can be add in the same Tx they created their identity commitment.
    function addMember(uint256 _vaultId, uint256 _identityCommitment) external {
        semaphore.addMember(_vaultId, _identityCommitment);
    }

    // function to remove member from a vault.
    function removeMember(
        uint256 _vaultId,
        uint256 _identityCommitment,
        uint256[] calldata _merkleProofSiblings
    ) external onlyAdmin {
        semaphore.removeMember(
            _vaultId,
            _identityCommitment,
            _merkleProofSiblings
        );
    }

    // function to update the contract admin.
    function changeAdmin(address _newAdmin) external onlyAdmin {
        admin = _newAdmin;
        emit ChangeAdmin(_newAdmin);
    }

    /// @notice Initiates a vault admin update in Semaphore. Current vault admin must call this.
    /// @dev Wraps Semaphore's updateGroupAdmin. The new admin must later call acceptVaultAdmin.
    function changeVaultAdmin(uint256 _vaultId, address _newAdmin) external {
        // Forward to Semaphore. Access control is enforced by Semaphore itself (caller must be current admin).
        semaphore.updateGroupAdmin(_vaultId, _newAdmin);
    }

    function acceptVaultAdmin(uint256 _vaultId) external {
        // call semaphore to accept the group admin role.
        semaphore.acceptGroupAdmin(_vaultId);
    }

    /// function to check if an identity commitment is member of a group.
    /// @notice Returns true if the identity commitment exists in the Semaphore group.
    /// @param _vaultId The vault id in Semaphore.
    /// @param _identityCommitment The identity commitment to check.
    /// @return True if the member exists, false otherwise.
    function isVaultMember(
        uint256 _vaultId,
        uint256 _identityCommitment
    ) external view returns (bool) {
        // The deployed Semaphore contract also exposes the ISemaphoreGroups view.
        // Cast to ISemaphoreGroups to call hasMember.
        return
            ISemaphoreGroups(address(semaphore)).hasMember(
                _vaultId,
                _identityCommitment
            );
    }

	function getUserPositionInDatabase(address _user) external view returns (uint256) {
		return userDatabase[_user].index;
	}

	function getAllUsersFromVault(uint256 _vaultId) external view returns (address[] memory) {
		return vaultUsers[_vaultId];
	}

	function getVaultIdsLength() external view returns (uint256) {
		return vaultIds.length;
	}

	function getAllVaultIds() external view returns (uint256[] memory) {
		return vaultIds;
	}
}
