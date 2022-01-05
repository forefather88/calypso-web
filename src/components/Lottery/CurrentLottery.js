import React, { useEffect, useState } from "react";
import Address from "../../const/Address";
import { Modal } from "react-bootstrap";
import { connect, useSelector } from "react-redux";
import {
  getLotterySc,
  getSigner,
  getCal,
  getLotteryManagerSc,
} from "../../utils/Contracts";
import { getWei, getEther } from "../../utils/Web3Utils";
import { toast } from "react-toastify";
import useInput from "../hook/useInput";
import TutorialPopup from "../Common/TutorialPopup";
import { timestampToLocalDate } from "../../utils/Utils";
import { useHistory } from "react-router";
import { getTickets } from "../../redux/actions";
import $ from "jquery";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import WinningDetails from "./WinningDetails";
import LotteryType from "./LotteryType";
import { getPrizesArray, reverseIndex } from "./LotteryUtils";
import PastDetails from "./PastDetails";

const CurrentLottery = (props) => {
  const {
    show,
    handleClose,
    currentLottery,
    sortedLotteries,
    getTickets,
    address,
    setLoading,
  } = props;

  const currentTickets =
    useSelector((state) => state.tickets.currentLottery) || [];
  const specificTickets =
    useSelector((state) => state.tickets.specificLottery) || [];

  const signer = getSigner();
  const CalSigner = getCal() && getCal().connect(signer);

  const [isRandomBatch, setIsRandomBatch] = useState(true);
  const [ticketsAmount, setTicketsAmount] = useState("1");
  const [approvedTicketBatch, setApprovedTicketBatch] = useState(false);
  const [stakeAmount, bindStakeAmount] = useInput("0");
  const [unstakeAmount, bindUntakeAmount] = useInput("0");
  const [ticketNumber, bindTicketNumber] = useInput("Enter 7-digit number");
  const [approvedStake, setApprovedStake] = useState(false);
  const [calAmount, setCalAmount] = useState("1");
  const [userStake, setUserStake] = useState("0");
  const [totalPoolSize, setTotalPoolSize] = useState("0");

  const [specificLottery, setSpecificLottery] = useState({});

  const [showDetails, setShowDetails] = useState(false);
  const handleCloseDetails = () => setShowDetails(false);
  const handleShowDetails = (lottery) => {
    getWinningAmount(lottery);
    getTickets(lottery._id, address, LotteryType.specificLottery);
    setSpecificLottery(lottery);
    setShowDetails(true);
  };

  const [showPastDetails, setShowPastDetails] = useState(false);
  const handleClosePastDetails = () => setShowPastDetails(false);
  const handleShowPastDetails = (lottery) => {
    setSpecificLottery(lottery);
    setShowPastDetails(true);
  };

  useEffect(() => {
    setCalAmount("1");
  }, [ticketNumber]);

  useEffect(() => {
    setCalAmount(stakeAmount);
  }, [stakeAmount]);

  useEffect(() => {
    setCalAmount(ticketsAmount);
  }, [ticketsAmount]);

  useEffect(() => {
    getUserStake();
  }, [address]);

  const getTicketsArray = () => {
    let array = [];
    for (let i = 0; i < ticketsAmount; i++) {
      array.push(i + 1);
    }
    return array;
  };

  // Purchasing tickets
  const approveGetTicketBatch = () => {
    setLoading(true);
    CalSigner &&
      CalSigner.approve(currentLottery._id, getWei(ticketsAmount.toString()))
        .then((tx) => {
          tx.wait().then(() => {
            setLoading(false);
            setApprovedTicketBatch(true);
            toast.success(
              <div>
                Approved Successfully!
                <br />
                Please click the Purchase batch button
              </div>
            );
          });
        })
        .catch((err) => {
          setLoading(false);
          toast.error(err.message);
        });
  };

  const purchaseTicketBatch = () => {
    setLoading(true);
    if (ticketsAmount == 0) {
      setLoading(false);
      return toast.error("Tickets amount should be higher than 0.");
    }
    let ticketNumbers = [];
    if (!isRandomBatch) {
      for (let i = 0; i < ticketsAmount; i++) {
        let numberStr = $("#ticketId-" + i).val();
        if (numberStr.length != 7) {
          setLoading(false);
          return toast.error("All Ticket number length should be equal to 7.");
        }

        let number = parseInt(numberStr);
        if (isNaN(number)) {
          setLoading(false);
          return toast.error(
            "All Ticket numbers length should contain numbers only."
          );
        }
        ticketNumbers.push(number);
      }
    }

    getLotterySc(currentLottery._id)
      .connect(signer)
      .getTicketBatch(ticketsAmount, ticketNumbers)
      .then((tx) => {
        tx.wait().then(async () => {
          setLoading(false);
          setApprovedTicketBatch(false);
          await getTickets(
            currentLottery._id,
            address,
            LotteryType.currentLottery
          );
          toast.success("Success!");
        });
      })
      .catch((err) => {
        setLoading(false);
        toast.error(err.message);
      });
  };

  //Stake/unstake
  const approveStake = () => {
    getUserStake();
    setLoading(true);
    CalSigner &&
      CalSigner.approve(Address.lotteryManager, getWei(calAmount.toString()))
        .then((tx) => {
          tx.wait().then(() => {
            setLoading(false);
            setApprovedStake(true);
            toast.success(
              <div>
                Approved Successfully!
                <br />
                Please click the Stake button
              </div>
            );
          });
        })
        .catch((err) => {
          setLoading(false);
          toast.error(err.message);
        });
  };

  const stake = () => {
    setLoading(true);
    if (stakeAmount == 0) {
      setLoading(false);
      return toast.error("Stake amount should be higher than 0.");
    }
    getLotteryManagerSc()
      .connect(signer)
      .stake(getWei(stakeAmount))
      .then((tx) => {
        tx.wait().then(() => {
          setLoading(false);
          setApprovedStake(false);
          getUserStake();
          toast.success("Success!");
        });
      })
      .catch((err) => {
        setLoading(false);
        toast.error(err.message);
      });
  };

  const unstake = () => {
    setLoading(true);
    /*if (stakeAmount == 0) {
      setLoading(false);
      return toast.error("Stake amount should be higher than 0.");
    }*/
    getLotteryManagerSc()
      .connect(signer)
      .unstake(getWei(unstakeAmount))
      .then((tx) => {
        tx.wait().then(() => {
          setLoading(false);
          getUserStake();
          setUserStake(userStake - unstakeAmount);
          toast.success("Success!");
        });
      })
      .catch((err) => {
        setLoading(false);
        toast.error(err.message);
      });
  };

  const unstakeAll = () => {
    setLoading(true);
    /*if (stakeAmount == 0) {
      setLoading(false);
      return toast.error("Stake amount should be higher than 0.");
    }*/
    getLotteryManagerSc()
      .connect(signer)
      .unstake(getWei(userStake))
      .then((tx) => {
        tx.wait().then(() => {
          setLoading(false);
          getUserStake(userStake);
          setUserStake("0");
          toast.success("Success!");
        });
      })
      .catch((err) => {
        setLoading(false);
        toast.error(err.message);
      });
  };

  const getUserStake = () => {
    if (signer) {
      getLotteryManagerSc()
        .connect(signer)
        .getUserStake()
        .then((res) => {
          setUserStake(getEther(res));
        })
        .catch((err) => {
          console.log(err);
        });

      getLotteryManagerSc()
        .connect(signer)
        .totalStaked.call()
        .then((res) => setTotalPoolSize(getEther(res)))
        .catch((err) => {
          console.log(err);
        });
    } else {
      toast.error("Please install Metamask extension");
    }
  };

  const claimReward = (lotteryAdrress, rowId) => {
    setLoading(true);
    getLotterySc(lotteryAdrress)
      .connect(signer)
      .claimPrize()
      .then((tx) => {
        tx.wait().then(() => {
          setLoading(false);
          toast.success("Success!");
          $(`#claimRow-${rowId}`).remove();
        });
      })
      .catch((err) => {
        setLoading(false);
        toast.error(err.message);
      });
  };

  const ticketItems = (tickets) => {
    return tickets.map((el, i) => {
      return (
        <div className="row ml-3">
          <div className="col-1">
            <span className="white">{i + 1}</span>
          </div>
          <div className="col-2">
            <p
              class="text-center"
              style={{
                backgroundColor: "#747272",
                color: "white",
                borderRadius: "5px",
              }}
            >
              {el.substring(1)}
            </p>
          </div>
        </div>
      );
    });
  };

  const batch = getTicketsArray().map((el, i) => {
    return (
      <input
        style={{
          backgroundColor: "#747272",
          color: "white",
          letterSpacing: "25px",
          border: "0",
          color: "yellow",
          maxWidth: "260px",
        }}
        className="form-control input-sm mt-1"
        type="text"
        id={"ticketId-" + i}
        maxlength="7"
      />
    );
  });

  const getWinningAmount = (lottery) => {
    let amount = 0;
    const prizes = getPrizesArray(lottery);
    prizes.forEach((el) => {
      if (el[0].length > 0) {
        const userTickets = el[0].filter(
          (i) => i.toLowerCase() == address
        ).length;
        const winningPart = (lottery.totalPrize * el[1]) / 100;
        amount += (winningPart * userTickets) / el[0].length;
      }
    });

    return amount;
  };

  const getStakerEarnings = (lottery) => {
    let amount = 0;
    const prizes = getPrizesArray(lottery);
    prizes.forEach((el) => {
      if (el[0].length > 0) {
        const winningPart = (lottery.totalPrize * el[1]) / 100;
        amount += (winningPart * el[0].length) / el[0].length;
      }
    });

    amount = (lottery.totalTickets - amount) * 0.95;
    return amount;
  };

  const claimResultsTable = sortedLotteries.slice(1).map((el, i) => {
    const winningAmount = getWinningAmount(el);
    const hasClaimed = el.usersClaimedPrize.some((el) => {
      return el.toLowerCase() == address;
    });
    if (winningAmount != 0 && !hasClaimed) {
      return (
        <>
          <tr id={`claimRow-${i}`}>
            <td>{i + 1}</td>
            <td>{timestampToLocalDate(el.createdDate, "DD/MM/YYYY")}</td>
            <td>{winningAmount}</td>
            <td>
              <button
                id={"details" + i}
                className="lotterygrey-btn"
                onClick={(e) => handleShowDetails(el)}
              >
                Details
              </button>{" "}
            </td>
            <td>
              <button
                className="lotteryyellow-btn"
                onClick={(e) => claimReward(el._id, i)}
              >
                Claim
              </button>
            </td>
          </tr>
        </>
      );
    }
  });

  const pastResultsTable = sortedLotteries.slice(1).map((el, i) => {
    const indexes = reverseIndex(sortedLotteries.slice(1));

    return (
      <>
        <tr>
          <td>{indexes[i]}</td>
          <td>{timestampToLocalDate(el.createdDate, "DD/MM/YYYY")}</td>
          <td>{el.totalTickets}</td>
          <td>{el.poolSize / 1e18}</td>
          <td>{getStakerEarnings(el)}</td>
          <td>
            <button
              className="lotterygrey-btn"
              onClick={(e) => {
                handleShowPastDetails(el);
              }}
            >
              Details
            </button>
          </td>
        </tr>
      </>
    );
  });

  return (
    <Modal
      className="transparent-modal"
      show={show}
      onHide={handleClose}
      keyboard={false}
      centered
      size="lg"
    >
      <Modal.Body
        className="px-3 py-3"
        style={{ backgroundColor: "#0f1f38", borderRadius: "15px" }}
      >
        <div className="row ">
          <div className="col-12 text-center">
            <h1 style={{ color: "white" }}>LUCKY DAY</h1>
          </div>
        </div>
        <div className="row ">
          <div className="col-12 text-center">
            <p style={{ color: "white" }}>{currentLottery._id}</p>
          </div>
        </div>
        <div className="row mt-4">
          <div className="col"></div>
          <div className="col text-center">
            <p className="white">Time Remaining</p>
            <p className="yellow">{/*secondsToHms(counter)*/}</p>
          </div>
          <div className="col text-center">
            <p className="white">Prize Pool</p>
            <p className="yellow">{currentLottery.totalPrize} CAL</p>
          </div>
          <div className="col text-center">
            <p className="white">Pool Size</p>
            <p className="yellow">{totalPoolSize} CAL</p>
          </div>
          <div className="col text-center">
            <p className="white">Est. APY</p>
            <p className="yellow">2100.84%</p>
          </div>
          <div className="col"></div>
        </div>
        <div className="row mt-2">
          <div className="col">
            <h4 className="white">Do you have what it takes to be a winner?</h4>
            <p className="grey">
              Amet minim mollit non deserunt ullamco est sit aliqua dolor do
              amet sint. Velit officia consequat duis enim velit mollit.
              Exercitation veniam consequat sunt nostrud amet.
            </p>
          </div>
        </div>
        <div className="row mt-2">
          <div className="col">
            <Tabs defaultIndex={0}>
              <TabList>
                <Tab>Purchase tickets</Tab>
                <Tab>View My Tickets</Tab>
                <Tab>Claim Winnings</Tab>
                <Tab>Stake and Withdraw</Tab>
                <Tab>Past Results</Tab>
              </TabList>

              <TabPanel>
                <div className="row mx-2">
                  <div className="col-4">
                    <div className="ml-4">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        onChange={(e) => setIsRandomBatch(!isRandomBatch)}
                        disabled={approvedTicketBatch}
                      ></input>
                      <TutorialPopup content="Select this option to enter ticket numbers manually">
                        <label className="form-check-label white">
                          Enter numbers manually
                        </label>
                      </TutorialPopup>
                    </div>
                    <TutorialPopup content="Purchasing an amount of tickets. Numbets of tickets shall be randomized by default">
                      <label style={{ color: "white" }}>
                        Purchase tickets:
                      </label>
                    </TutorialPopup>
                    <div className="row  align-items-center">
                      <button
                        className="btn-sub-add mr-1"
                        onClick={() =>
                          setTicketsAmount(parseInt(ticketsAmount) - 1)
                        }
                      >
                        -
                      </button>
                      <input
                        className="text-input noarrows mt-3"
                        type="number"
                        disabled={approvedTicketBatch}
                        style={{ WebkitAppearance: "none", margin: "0" }}
                        onChange={(e) => setTicketsAmount(e.target.value)}
                        style={{ width: "30%", textAlign: "center" }}
                        value={ticketsAmount}
                      />
                      <button
                        className="btn-sub-add ml-1"
                        onClick={() =>
                          setTicketsAmount(parseInt(ticketsAmount) + 1)
                        }
                      >
                        +
                      </button>
                    </div>

                    {!isRandomBatch && batch}

                    <button
                      className="yellow-btn mt-3 mr-3"
                      onClick={
                        approvedTicketBatch
                          ? purchaseTicketBatch
                          : approveGetTicketBatch
                      }
                    >
                      {approvedTicketBatch ? "Purchase batch" : "Approve CAL"}
                    </button>
                  </div>
                  <div className="col-8"></div>
                </div>
              </TabPanel>
              <TabPanel>
                {(currentTickets.length > 0 && (
                  <div className="row">
                    <div className="col">
                      <span className="white">Total tickets purchased: </span>
                      <span className="yellow">{currentTickets.length}</span>
                      <h3 style={{ color: "white" }}>Your tickets:</h3>
                      {ticketItems(currentTickets)}
                    </div>
                  </div>
                )) || (
                  <>
                    <h4 className="white">
                      You have not purchased any ticket yet
                    </h4>
                    <br />
                    <br />
                  </>
                )}
              </TabPanel>
              <TabPanel>
                <table className="table" style={{ color: "white" }}>
                  <thead className="details-table">
                    <tr>
                      <th scope="col">Draw#</th>
                      <th scope="col">Date</th>
                      <th scope="col">Claim Amount</th>
                      <th scope="col">Details</th>
                      <th scope="col"></th>
                    </tr>
                  </thead>
                  <tbody>{claimResultsTable}</tbody>
                </table>

                <WinningDetails
                  showDetails={showDetails}
                  handleCloseDetails={handleCloseDetails}
                  tickets={specificTickets}
                  lottery={specificLottery}
                />
              </TabPanel>
              <TabPanel>
                <div className="row">
                  <p className="white ml-3">Current stake: {userStake} CAL</p>
                </div>
                <div className="row">
                  <div className="col">
                    <label style={{ color: "white" }}>I want to stake:</label>
                  </div>
                  <div className="col">
                    <label style={{ color: "white" }}>
                      I want to withdraw:
                    </label>
                  </div>
                </div>
                <div className="row">
                  <div className="col-3">
                    <input type="number" {...bindStakeAmount} />
                  </div>
                  <div className="col-3">
                    <button
                      className="lotteryyellow-btn"
                      onClick={approvedStake ? stake : approveStake}
                    >
                      {approvedStake ? "Stake" : "Approve CAL"}
                    </button>
                  </div>
                  <div className="col-3">
                    <input type="number" {...bindUntakeAmount} />
                  </div>
                  <div className="col-3">
                    <button className="lotteryyellow-btn" onClick={unstake}>
                      &nbsp;&nbsp;&nbsp;Withdraw&nbsp;&nbsp;
                    </button>
                    <button className="lotteryyellow-btn" onClick={unstakeAll}>
                      Withdraw All
                    </button>
                  </div>
                </div>
              </TabPanel>
              <TabPanel>
                <table className="table" style={{ color: "white" }}>
                  <thead className="details-table">
                    <tr>
                      <th scope="col">Draw#</th>
                      <th scope="col">Date</th>
                      <th scope="col">Ticket sales</th>
                      <th scope="col">Pool Size</th>
                      <th scope="col">Staker Earnings</th>
                      <th scope="col">Details</th>
                    </tr>
                  </thead>
                  <tbody>{pastResultsTable}</tbody>
                </table>

                <PastDetails
                  showPastDetails={showPastDetails}
                  handleClosePastDetails={handleClosePastDetails}
                  lottery={specificLottery}
                />
              </TabPanel>
            </Tabs>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
export default connect(null, { getTickets })(CurrentLottery);