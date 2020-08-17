import React, { Component } from "react";
import { Link, Switch, Route, BrowserRouter, withRouter } from 'react-router-dom';
import { Button, Card, Elevation, InputGroup, Spinner } from "@blueprintjs/core";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle} from '@fortawesome/free-solid-svg-icons'
import './twitchSection.css'

class TwitchSection extends Component {
	constructor(props) {
        super(props);
        this.state = {
            streams: null
        }; 
        


	}
	async componentDidMount(){
        if(!this.state.streams){
            //get streams
            const response = await fetch('/twitch');
            const json = await response.json();
            console.log("twitch", json.streams)
            if (response.status !== 200) {
                throw Error(response.message)
            }
            //console.log(json.posts)
            this.setState( {streams: json.streams} )
        }
    }

	render(){

		return (
            <div className="parentT">
                {this.state.streams &&
                    this.state.streams.map((item, key) => {
                        return  <a className="twitchLink" href={item.streamURL} target="_blank" rel="noopener noreferrer">
                                    <div className="twitchObject">
                                        <img className="thumbnailClass" src={item.thumbnailURL}></img>
                                        <div className="viewClass">
                                            <FontAwesomeIcon className="iconClass" icon={faCircle} size="1x" color="red"/>
                                            <h2 className="viewText">{item.viewerCount}</h2>
                                        </div>
                                        <Card className="captionClass">
                                            <h3 className="streamTitle captionText">{item.streamTitle}</h3>
                                            <h4 className="captionText">{item.channelName}</h4>
                                        </Card>
                                    </div>
                                </a>
                                
                    })
                }
            </div>
		);
	}

}

export default TwitchSection;