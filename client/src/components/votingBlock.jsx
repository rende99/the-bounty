import React, { Component } from "react";
import { Link, Switch, Route, BrowserRouter, withRouter } from 'react-router-dom';
import { Button, Card, Elevation, InputGroup, Spinner } from "@blueprintjs/core";
import Cookies from 'js-cookie'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck} from '@fortawesome/free-solid-svg-icons'
import './votingBlock.css'

class VotingBlock extends Component {
	constructor(props) {
        super(props);
        this.state = {
            data: null,
            selectedIndex: Cookies.get('vote') // if cookie exists, give the value
        }; 
        
        this.voteClicked = this.voteClicked.bind(this)

	}
	async componentDidMount(){
        console.log("cdidmount")
        //get games
        const response = await fetch('/votingGames');
        const json = await response.json();
        console.log(json)
        if (response.status !== 200) {
            throw Error(response.message)
        }
        //console.log(json.posts)
        this.setState( {data: json} )
        
        
    }

    async voteClicked(key){
        console.log(key)
        if(Cookies.get('vote') == undefined){
            await fetch('/vote', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    gameObj: this.state.data.games[key]
                })
            })
            //get new vote value
            var timeUntilTomorrowDays = this.getDaysMidnight()
            Cookies.set('vote', key, {expires: timeUntilTomorrowDays})
            const response = await fetch('/votingGames');
            const json = await response.json();
            if (response.status !== 200) {
                throw Error(response.message)
            }
            //console.log(json.posts)
            this.setState( {data: json} )
            this.setState( {selectedIndex: key} )

        }
    }

    getDaysMidnight(){
        var midnight = new Date();
        midnight.setHours(24,0,0,0)
        console.log( (midnight.getTime() - new Date().getTime())/1000/60/60/24 ) // days until midnight ( <1 )
        return (midnight.getTime() - new Date().getTime())/1000/60/60/24
    }

	render(){

		return (
            <div className="parentV">
                {this.state.data &&
                    this.state.data.games.map((item, key) => {
                        if(this.state.selectedIndex == key){
                            return  <Card className={"chosenRow"} interactive={false} onClick={() => this.voteClicked(key)} key={key}>

                                        <div className="col2">
                                            <img className="imageIcon" src={item.imgSrc}></img>
                                        </div>
                                        <div className="col2">
                                            <h3 className="gameDesc"><b>{item.name}</b></h3>
                                            <h4 className="gameDesc"><i>{item.categoryName}</i></h4>
                                        </div>
                                        <div className="col2Right">
                                            <h3 className="gameDesc">Votes</h3>
                                            <h4 className="gameDesc"><i>{item.votes}</i></h4>
                                        </div>
                                        <div className="col2Icon">
                                            <FontAwesomeIcon className="iconClass" icon={faCheck} size="1x" color="white"/>
                                        </div>
                                        
                                    </Card>
                        }else{
                            return  <Card className={"row bp3-dark"} interactive={false} onClick={() => this.voteClicked(key)} key={key}>

                                        <div className="col2">
                                            <img className="imageIcon" src={item.imgSrc}></img>
                                        </div>
                                        <div className="col2">
                                            <h3 className="gameDesc"><b>{item.name}</b></h3>
                                            <h4 className="gameDesc"><i>{item.categoryName}</i></h4>
                                        </div>
                                        <div className="col2Right">
                                            <h3 className="gameDesc">Votes</h3>
                                            <h4 className="gameDesc"><i>{item.votes}</i></h4>
                                        </div>
                                    </Card>
                        }
                        
                        
                    })
                    
                }
            </div>
		);
	}

}

export default VotingBlock;