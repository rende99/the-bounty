import React, { Component } from 'react';
import { Route, withRouter } from 'react-router-dom';
import './App.css';
import Home from './Home';

class App extends Component {
	constructor(props) {
		super(props)
		this.state ={
			data: null
		}
  }

  render(){
    return (
      <div className="App">
        <Route exact path="/" component={Home}/>
      </div>
    );
  }

}

export default withRouter(App);
