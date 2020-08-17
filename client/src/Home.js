import React, {Component, useEffect, useState} from 'react';
import { Button, Card, Elevation, InputGroup, Spinner } from "@blueprintjs/core";
import { Link, Redirect} from "react-router-dom";
import './Home.css'
import PrevWBlock from './components/prevWBlock';
import VotingBlock from './components/votingBlock';
import TwitchSection from './components/twitchSection';


class Home extends Component {
    constructor(props) {
        super(props)
		this.state ={
            data: null,
            bountyLengthInMillis: 864000000,
            bountyValue: 0.00,
            timeLeft: null
        }
        this.startTimer = this.startTimer.bind(this);
        this.countDown = this.countDown.bind(this);
        this.getBalance = this.getBalance.bind(this);
    }
    
    async componentDidMount() {
        const response = await fetch('/currentBounty');

        const json = await response.json();
        console.log(json)
        if (response.status !== 200) {
            throw Error(response.message)
        }
        //console.log(json.posts)
        this.setState( {data: json} )
        console.log(this.state.bountyLengthInMillis)
        this.setState( {timeLeft: json.bountyInfo.startDate + this.state.bountyLengthInMillis - (new Date()).getTime()} )
        this.startTimer()
        
        await fetch('/bountyOver')
        this.getBalance(); //initial call
        setInterval(this.getBalance, 10000); // run it back every 10 sec

    }

    async getBalance(){
        const balanceResponse = await fetch('/getBalance');
        const balanceJSON = await balanceResponse.json();
        if (balanceResponse.status !== 200) {
            throw Error(balanceResponse.message)
        }
        this.setState( {bountyValue: balanceJSON.amt} )
    }

    donateButton() {
        return  <form className="inline label" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
                    <input type="hidden" name="cmd" value="_s-xclick" />
                    <input type="hidden" name="hosted_button_id" value="J27YQ8FD6RGPY" />
                    <input type="image" src="https://www.paypalobjects.com/digitalassets/c/website/marketing/apac/C2/logos-buttons/optimize/44_Grey_PayPal_Pill_Button.png" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
                    <img alt="" border="0" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1" />
                </form>
    }

    startTimer(){
        setInterval(this.countDown, 1000);
        console.log(this.state.timeLeft)
    }
    countDown(){
        this.setState( {timeLeft: this.state.timeLeft - 1000}, async () => {
            //check if timer has run out.
            if(this.state.timeLeft <= 999) {
                // <1 sec left. i.e. time to change!
                const newBountyResponse = await fetch('/bountyOver');
                const bountyJSON = await newBountyResponse.json();
                if (newBountyResponse.status !== 200) {
                    throw Error(newBountyResponse.message)
                }

            }
            console.log(this.state.timeLeft)
        } )
    }

    formatTime(ms, isBountyTime, type){
        var days = Math.floor(ms / (24*60*60*1000));
        var daysms=ms % (24*60*60*1000);
        var hours = Math.floor((daysms)/(60*60*1000));
        var hoursms=ms % (60*60*1000);
        var minutes = Math.floor((hoursms)/(60*1000));
        var minutesms=ms % (60*1000);
        var sec = Math.floor((minutesms)/(1000));
        //now add extra 0 if necessary:
        if(isBountyTime){
            switch(type){
                case "days":
                    return (days < 10 ? '0' + days : days);
                case "hours":
                    return (hours < 10 ? '0' + hours : hours);
                case "minutes":
                    return (minutes < 10 ? '0' + minutes : minutes);
                case "seconds":
                    return (sec < 10 ? '0' + sec : sec);
                default:
                    break;
            }
            return  "";
        }else{
            return (hours < 10 ? (hours == 0 ? "" : '0' + hours +"h ") : hours +"h ") + (minutes < 10 ? ((minutes == 0 && hours == 0) ? "" : '0' + minutes +"m ") : minutes +"m ") + (sec < 10 ? '0' + sec + "s" : sec + "s") ;
        }
    }
    formatBounty(bounty){
        return '$' + bounty
    }
    
    render(){
        return ( 
            <div className="dummy bp3-dark">
                {!this.state.data &&
                    <div className="spinnerClass">
                        <Spinner  size={100}/>
                        <h2 className="sectionTitle">Loading the Bounty...</h2>
                    </div>
                }
                {this.state.data &&
                <div>
                    <div className="bigDiv">

                        <div className="contentDiv">
                            <div className="topContainer">
                                <div className="pastWParent">
                                    <h1 className="sectionTitle">Past Winners</h1>
                                    <PrevWBlock />
                                </div>
                                <Card className="currentBountyCard bp3-dark" elevation={Elevation.ZERO}>
                                    <h1 className="pageTitle">Current Bounty</h1>
                                    <a href={this.state.data.gameInfo.link} target="_blank" rel="noopener noreferrer">
                                        <img className="bountyImage" src={this.state.data.gameInfo.imgSrc}></img>
                                    </a>
                                    <h2 className="gameName">{this.state.data.gameInfo.name}</h2>
                                    <h3 className="gameCategory"><i>{this.state.data.gameInfo.categoryName}</i></h3>
                                    <a href={this.state.data.gameInfo.WRRun.link} target="_blank" rel="noopener noreferrer">
                                        <div className="WRDiv">
                                            <h2 className="inline bp3-dark">Current WR:</h2>
                                            <h2 className="inline bp3-dark"> {this.formatTime(this.state.data.gameInfo.WRRun.time * 1000, false)} by </h2>
                                            <h2 className="inline bp3-dark gradient" style={{background: '-webkit-linear-gradient(0deg,'+ this.state.data.gameInfo.runner.colorFrom + ',' + this.state.data.gameInfo.runner.colorTo + ')',  '-webkit-background-clip': 'text',
    '-webkit-text-fill-color': 'transparent'}}>{this.state.data.gameInfo.runner.runnerName}</h2>
                                        </div>
                                    </a>
                                    <Card className="bountyCard bp3-dark" elevation={Elevation.FOUR} >
                                        <h1 className="bountyValue">{this.formatBounty(this.state.bountyValue)}</h1>
                                    </Card>
                                    <h4 className="sectionTitle">Bounty expires in:</h4>
                                    <div className="bountyTimerDiv">
                                        <Card className="timerCard">
                                            <h1 className="timeText">{this.formatTime(this.state.timeLeft, true, "days")}</h1>
                                            <h6 className="timeText bp3-text-small">days</h6>
                                        </Card>
                                        <Card className="timerCard">
                                            <h1 className="timeText">{this.formatTime(this.state.timeLeft, true, "hours")}</h1>
                                            <h6 className="timeText bp3-text-small">hours</h6>
                                        </Card>
                                        <Card className="timerCard">
                                            <h1 className="timeText">{this.formatTime(this.state.timeLeft, true, "minutes")}</h1>
                                            <h6 className="timeText bp3-text-small">minutes</h6>
                                        </Card>
                                        <Card className="timerCard">
                                            <h1 className="timeText">{this.formatTime(this.state.timeLeft, true, "seconds")}</h1>
                                            <h6 className="timeText bp3-text-small">seconds</h6>
                                        </Card>
                                    </div>
                                </Card>
                                <div className="voteDiv">
                                    <h1 className="sectionTitle">Vote for the next Bounty:</h1>
                                    <h4 className="caption bp3-ui-text"><i>The game with the most votes when time expires will receive the next Bounty</i></h4>
                                    <h4 className="caption bp3-ui-text"><i>Vote once per day!</i></h4>

                                    <VotingBlock timeLeft={this.state.timeLeft}/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="contentDiv">
                        <h1 className="sectionTitle">Add to the Bounty:</h1>
                        <Card className="addArea bp3-dark">
                            <div className="actionDiv">
                                {this.donateButton()}
                                <h3 className="inline label">or</h3>
                                <Button className="inline label">Watch some Ads</Button>
                            </div>
                        </Card>
                    </div>
                    <div className="bigTwitchDiv">
                        <h1 className="sectionTitle">Bounty streams live on Twitch:</h1>
                    </div>
                </div>
                }
                <TwitchSection />
            </div>
        );
    }
}

export default Home;