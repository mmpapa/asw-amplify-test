import React, {useState, useEffect} from "react"
import './App.css';
import {Amplify, API, Storage} from "aws-amplify";
import {withAuthenticator, Text, Heading, Divider, Image, Button, TextField, Flex, Card } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import awsExports from "./aws-exports";

import { FaBeer, FaBell } from 'react-icons/fa';

import {listNotes} from "./graphql/queries";
import {createNote as createNoteMutation,deleteNote as deleteNoteMutation} from "./graphql/mutations";

Amplify.configure(awsExports);

const initialFormState = { name: '', description: '' }

function App({signOut, user}) {

  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [isLoad, setIsLoad] = useState(true);

  useEffect(() => {
    fetchNotes();
    setIsLoad(false);
  });
  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;

    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }));

    setNotes(apiData.data.listNotes.items);
  }
  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }
  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }
  async function onChangeFile(e) {
    if (!e.target.files[0]) return;
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  return (
    <div className="App" style={{"padding": "2rem"}}>
      <Heading level={2}>My Notes App</Heading>
      <Heading level={6} color="green" fontWeight="bold">{user.attributes.email} &nbsp; <FaBeer />  &nbsp; <FaBell /></Heading>
      <br />
      <Divider  label="の" />
      <br/>
      <Flex direction="row" gap="1rem" 
      //justifyContent="flex-start" 
      style={{"margin": "10px", "text-align": "left"}}>
      <TextField
        //type="text"
        width="20rem"
        //direction="column"
        //inputMode="text"      
        label="ノート名"
        isRequired={true}
        //hasError={true}
        //descriptiveText="ノート名"
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="ノート名を入力してください。"
        value={formData.name}
      />
      <TextField
        label="説明"
        width="40rem"
        justifyContent="flex-start"
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="説明を入力してください"
        value={formData.description}
      />
      <input type="file" onChange={onChangeFile} style={{"margin-top": "2.3rem"}}/>
      </Flex>
      <br/>
      <Button isLoading={isLoad}
       loadingText="まーだだよ"
       onClick={createNote}
       style={{"text-align": "right"}}>
        登録
      </Button>
      <br/>
      <br/>
      <Divider  label="リスト" />
      <div style={{marginBottom: 30}}>
        {
          notes.map(note => (
            <Card key={note.id || note.name} padding="1rem" variation="elevated">
                <Heading level={5}>{note.name}</Heading>
                <Text>{note.description}</Text>
                {
                  note.image && <Image src={note.image} width="400px" onClick={() => alert('📸 Say cheese!')} />
                }
                <br/>
                <Button onClick={() => deleteNote(note)}>これ削除</Button>
            </Card>
          ))
        }
      </div>
      <div>
        <button onClick={signOut}>サインアウト</button>
      </div>
    </div>
  );
}

export default withAuthenticator(App);
