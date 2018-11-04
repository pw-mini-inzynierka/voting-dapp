pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;


contract VotingContract {
    
    string public question;
    address public category;
    string[] public options;
    uint256 public votingEndTime;
    uint256 public resultsEndTime;
    bool public isPrivate;
    mapping(address => bool) internal permissions;
    mapping(address => bool) internal hasVoted;
    uint256[] internal votes;

    modifier hasPermission(address user) {
        require(!isPrivate || (isPrivate && permissions[user]), "You don't have voting permission");
        _;
    }
    
    modifier isInVotingState() {
        require(now <= votingEndTime, "It's too late to vote");
        _;
    }
    
    modifier isInResultsState() {
        require(now <= resultsEndTime && now > votingEndTime, "You cannot see the results right now");
        _;
    }
    
    // TODO: Do we need some creator requirements?
    constructor(string _question,
        address _category,
        string[] _options,
        uint256 _votingEndTime,
        uint256 _resultsEndTime,
        bool _isPrivate,
        address[] _permissions) public {

        require(_votingEndTime > now, "Voting end time has to be somwhere in the future");
        require(_votingEndTime < _resultsEndTime, "Voting end time has to be earlier than results end time");
        require(_options.length >= 2, "You cannot create a ballot without at least 2 options");
                    
        question = _question;
        category = _category;
        options = _options;
        votingEndTime = _votingEndTime;
        resultsEndTime = _resultsEndTime;
        isPrivate = _isPrivate;
        for (uint i = 0; i < _permissions.length; i++) {
            permissions[_permissions[i]] = true;
        }
        votes.length = _options.length;
    }

    function vote(uint _option) public 
                                    hasPermission(msg.sender)
                                    isInVotingState() {
        require(!hasVoted[msg.sender], "You have already voted");
        votes[_option]++;
        hasVoted[msg.sender] = true;
    }
    
    function viewVotes() public view returns(uint256[]) {
        require(now > votingEndTime && now < resultsEndTime, "You cannot view the votes now");
        return votes;
    }

    function viewContractInfo() public view hasPermission(msg.sender) returns(string, address, string[], uint256, uint256) {
        return (question, category, options, votingEndTime, resultsEndTime);
    }
    
}