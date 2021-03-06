import React from 'react';
import { connect, sendMessage, getMessagesOfUser, getWorkSpaceMessagesFromServer } from '../socketHelpers';
import { Input, Button, Popover, PopoverHeader, PopoverBody, Alert } from 'reactstrap';
import NavBar from './NavBar.jsx';
import MessageList from './MessageList.jsx';
import Body from './Body.jsx';
import Dropzone from 'react-dropzone';
import upload from 'superagent';
import Typing from './Typing.jsx'

//The main component of the App. Renders the core functionality of the project.
export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      //Default message informs the user to select a workspace
      messages: [
        {
          text: 'Welcome to slackk-casa! Please select or create a workspace!',
          username: 'Slack-bot',
          id: 0,
          createdAt: new Date(),
          workspaceId: 0,
        },
      ],
      users: [],
      usernames: [],
      workSpaces: [],
      query: '',
      currentWorkSpaceId: 0,
      currentWorkSpaceName: '',
      selectedUser: 'All users', 
      workspaceMentioned: [],
      popoverOpen: false,
      typer: '',
      typerWorkSpaceId: '',
      renderTyping: false,
    };
    this.handleSelectedUser = this.handleSelectedUser.bind(this);
    this.getMessagesByKeywords = this.getMessagesByKeywords.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.toggleTwo = this.toggleTwo.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentDidMount() {
    let server = location.origin.replace(/^http/, 'ws');
    // connect to the websocket server
    connect(server, this);
  }

  // changes the query state based on user input in text field
  handleChange(event) {
    this.setState({
      query: event.target.value,
    });
  }

  // sends message on enter key pressed and clears form
  // only when shift+enter pressed breaks to new line
  handleKeyPress(event) {
    // on key press enter send message and reset text box
    if (event.charCode === 13 && !event.shiftKey) {
      event.preventDefault();
      sendMessage({
        username: this.props.location.state.username,
        text: this.state.query,
        workspaceId: this.state.currentWorkSpaceId,
      });
      // resets text box to blank string
      this.setState({
        query: '',
      });
    }
  }

  handleSelectedUser(event) {
    let currentWorkSpaceId = this.state.currentWorkSpaceId;
    // event.target.value is user when one was selected from option selection
    // event is this.selectedUser when one changes input in search textbox   
    let username = event ? event.target.value : this.state.selectedUser; 
    if (username === "All users") {
        getWorkSpaceMessagesFromServer(currentWorkSpaceId);     
    } else {
      getMessagesOfUser(username, currentWorkSpaceId);
    } 
    this.setState( { selectedUser: username } );      
  }

  //grabs all existing workspaces
  loadWorkSpaces() {
    fetch('/workspaces')
      .then(resp => resp.json())
      .then(workSpaces => this.setState({ workSpaces }))
      .catch(console.error);
  }

  //Helper function to reassign current workspace
  changeCurrentWorkSpace(id, name) {
    this.setState({ currentWorkSpaceId: id, currentWorkSpaceName: name, selectedUser: 'All users' });
  }

  getMessagesByKeywords(query) {
    // search only if query not empty
    if (query.value !== '') {
      let messages = this.state.messages
        .filter(message => message.text.includes(query.value));
      this.setState( { messages } );
    }
  }
  //renders nav bar, body(which contains all message components other than input), and message input
  
  onDrop(files) {
    //use upload to send file to server
      upload.post('/aws/upload')
      .attach('theseNamesMustMatch', files[0])
      .end((err, res) => {
        if (err) console.log(err);
        console.log('File uploaded!');
        // send aws url (res) as text to web-sockets
        event.preventDefault();
        // use sendMessage to send aws s3 url to websocket
        sendMessage({
          username: this.props.location.state.username,
          text: res.text,
          workspaceId: this.state.currentWorkSpaceId,
        });
      })
  }

  toggleTwo() {
    this.setState({
      popoverOpen: !this.state.popoverOpen
    });
  }

  handleKeyDown(event) {
    sendTypeStatus({
      username: this.props.location.state.username,
      workspaceId: this.state.currentWorkSpaceId,
    });
  }

  render() {
    let {
      messages, usernames, query, workSpaces, currentWorkSpaceId, currentWorkSpaceName, selectedUser, workspaceMentioned, popoverOpen,
    } = this.state;
    return (
      <div className="app-container">
        <NavBar currentWorkSpaceName={currentWorkSpaceName} />
        <Body
          usernames={usernames}
          messages={messages}
          workSpaces={workSpaces}
          loadWorkSpaces={() => this.loadWorkSpaces()}
          changeCurrentWorkSpace={(id, name) => this.changeCurrentWorkSpace(id, name)}
          currentWorkSpaceId={currentWorkSpaceId}
          handleSelectedUser={this.handleSelectedUser}
          getMessagesByKeywords={this.getMessagesByKeywords}
          selectedUser={selectedUser}
          workspaceMentioned={workspaceMentioned}
          currentUser={this.props.location.state.username}
        />
        <div className="input-box">
          <div className="typing-alert">
            {this.state.renderTyping && this.state.currentWorkSpaceId === this.state.typerWorkSpaceId && this.props.location.state.username !== this.state.typer ? <Typing typer={this.state.typer}/> : <Alert color="light" style={{padding: "0 0 0 0", margin: "0 0 0 0", opacity: "0"}}>Hello</Alert>}
          </div>
          <div className="input-container">
            <Input
              value={query}
              className="message-input-box"
              type="textarea"
              name="text"
              placeholder={`Message #${currentWorkSpaceName || 'select a workspace!'}`}
              onChange={event => this.handleChange(event)}
              onKeyPress={event => this.handleKeyPress(event)}
              onKeyDown={event => this.handleKeyDown(event)}
            />
          </div> 
          <div className="upload-file-button">
            <Button className="upload-button" id="Popover2" onClick={this.toggleTwo} color="success">+</Button>
            <Popover placement="bottom" isOpen={popoverOpen} target="Popover2" toggleTwo={this.toggleTwo}>
              <PopoverHeader>Upload File</PopoverHeader>
              <PopoverBody>
                <Dropzone onDrop={this.onDrop}>
                  <div>Drop or click to select a file to upload.</div>
                </Dropzone>
              </PopoverBody>
            </Popover>
          </div>
        </div>
      </div>
    );
  }
}