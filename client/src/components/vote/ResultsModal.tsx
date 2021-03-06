import React, { Component, Fragment } from "react";
import { ControlLabel, Modal, Panel, Table } from "react-bootstrap";
import { Voting, VotingInfo } from "../../utils/types";
import ResultsPieChart from "./ResultsPieChart";
import { covertTimestampToDate } from "./VoteModal";

interface IResultsModalProps {
  results: string[];
  show: boolean;
  voting: Voting;
  handleOnHide: () => void;
}

export default class ResultsModal extends Component<IResultsModalProps> {
  constructor(props) {
    super(props);
  }

  public getSortedAnswersWithResults = () => {
    const results = this.props.results.map((result) => parseInt(result, 10));
    // const resultsPercentage = this.props.results.map((result) => parseInt(result, 10)/results);

    results.sort().reverse();
    const votingInfo: VotingInfo = this.props.voting.info;
    const answersAndResults: Array<{ answer: string; result: number }> = [];
    for (let i = 0; i < this.props.voting.info.answers.length; i++) {
      const currentAnswer = votingInfo.answers[i];
      const currenResult = parseInt(this.props.results[i], 10);
      answersAndResults.push({ answer: currentAnswer, result: currenResult });
    }

    answersAndResults.sort((first, second) => {
      return second.result - first.result;
    });

    return answersAndResults;
  };

  public render() {
    const answersAndResults = this.getSortedAnswersWithResults();
    const sumOfAllVotes = answersAndResults.reduce((partial, obj) => partial + obj.result, 0);
    return (
      <Modal show={this.props.show} onHide={this.props.handleOnHide}>
        <Modal.Body>
          <Panel>
            <Panel.Heading>
              <Panel.Title className="text-center" style={{ fontSize: "1.5em", fontWeight: "bold" }}>
                Voting info
              </Panel.Title>
            </Panel.Heading>
            <Panel.Body>
              <ControlLabel style={{ fontSize: "1.2em" }}>Question</ControlLabel>
              <p>{this.props.voting.info.question}</p>

              <ControlLabel style={{ fontSize: "1.2em" }}>Possible answers</ControlLabel>
              <ul>
                {this.props.voting.info.answers.map((answer) => {
                  return <li key={answer}>{answer}</li>;
                })}
              </ul>
              <ControlLabel style={{ fontSize: "1.2em" }}>Voting deadline</ControlLabel>
              <p>{covertTimestampToDate(this.props.voting.info.votingEndTime)}</p>
              <ControlLabel style={{ fontSize: "1.2em" }}>Results expiry date</ControlLabel>
              <p>{covertTimestampToDate(this.props.voting.info.resultsEndTime)}</p>
              <ControlLabel style={{ fontSize: "1.2em" }}>Voting type</ControlLabel>
              <p>{this.props.voting.info.isPrivate ? "Private" : "Public"}</p>
              <ControlLabel style={{ fontSize: "1.2em" }}>Voting address</ControlLabel>
              <p>{this.props.voting.contract._address}</p>
            </Panel.Body>
          </Panel>

          <Panel>
            <Panel.Heading>
              <Panel.Title className="text-center" style={{ fontSize: "1.5em", fontWeight: "bold" }}>
                Voting results
              </Panel.Title>
            </Panel.Heading>
            <Panel.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th style={{ textAlign: "center" }}>Answer</th>
                    <th style={{ textAlign: "center" }}>No. votes</th>
                    <th style={{ textAlign: "center" }}>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {answersAndResults.map((element) => (
                    <tr key={element.answer}>
                      <td style={{ width: "65%" }}>{element.answer}</td>
                      <td style={{ textAlign: "center" }}>{element.result}</td>
                      <td style={{ textAlign: "center" }}>
                        {((100 * element.result) / (sumOfAllVotes > 0 ? sumOfAllVotes : 1)).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {this.props.results.every((val) => parseInt(val, 10) === 0) ? (
                <h3 className="text-center">No one has voted!</h3>
              ) : (
                <Fragment>
                  <ResultsPieChart results={this.props.results} voting={this.props.voting} />
                </Fragment>
              )}
            </Panel.Body>
          </Panel>
        </Modal.Body>
      </Modal>
    );
  }
}
