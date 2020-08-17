import React, { Component } from "react";
import { Link, Switch, Route, BrowserRouter, withRouter } from 'react-router-dom';
import { Button, Card, Elevation, InputGroup, Spinner } from "@blueprintjs/core";
import './prevWBlock.css'

class PrevWBlock extends Component {
	constructor(props) {
        super(props);
        this.state = {
            data: null
        }; 
        


	}
	async componentDidMount(){
        if(!this.state.data){
            //get games
            const response = await fetch('/prevBounties');
            const json = await response.json();
            console.log(json.data)
            if (response.status !== 200) {
                throw Error(response.message)
            }
            //console.log(json.posts)
            this.setState( {data: json.data} )
        }
    }
    formatBounty(bounty){
        return '$' + bounty
    }

	render(){

		return (
            <div className="parent">
                {this.state.data &&
                    this.state.data.map((item, key) => {
                        return  <a href={item.link} target="_blank" rel="noopener noreferrer">
                                    <Card className="rowWinner bp3-dark">
                                        <div className="col2Image">
                                            <img className="imageIcon" src={item.imgSrc}></img>
                                            <h4 className="gameDesc">{item.runnerName}</h4>
                                        </div>
                                        <div className="col2">
                                            <h3 className="gameDesc"><b>{item.name}</b></h3>
                                            <h4 className="gameDesc"><i>{item.categoryName}</i></h4>
                                        </div>
                                        <div className="col2Right">
                                            <h3>{this.formatBounty(item.bounty)}</h3>
                                        </div>
                                    </Card>
                                </a>
                    })
                    
                }
            </div>
		);
	}

}

export default PrevWBlock;