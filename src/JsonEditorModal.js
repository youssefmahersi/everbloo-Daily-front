import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button } from "@mui/material";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase"; 


const JsonEditorModal = ({ open, handleClose, collectionPath, docId }) => {
  const [jsonContent, setJsonContent] = useState(""); // Initialize as an empty string
  const [isLoading, setIsLoading] = useState(false); // Track loading state
  // Effect to update jsonContent when jsonData or modal open state changes
  // useEffect(() => {
  //   if (open && jsonData) {
  //     setJsonContent(JSON.stringify(jsonData, null, 2)); // Prettify JSON
  //   }
  // }, [open, jsonData]);

  // const handleEditorChange = (newValue) => {
  //   setJsonContent(newValue);
  // };

  // const handleSaveClick = () => {
  //   try {
  //     const updatedJson = JSON.parse(jsonContent); // Validate JSON
  //     handleSave(updatedJson);
  //   } catch (error) {
  //     alert("Invalid JSON format! Please correct and try again.");
  //   }
  // };
  useEffect(() => {
    const fetchJsonData = async () => {
      if (open && collectionPath && docId) {
        try {
          setIsLoading(true);
          const docRef = doc(db, collectionPath, docId);
          const docSnapshot = await getDoc(docRef);
          if (docSnapshot.exists()) {
            setJsonContent(JSON.stringify(docSnapshot.data(), null, 2)); // Prettify JSON
          } else {
            setJsonContent("{}"); // Default empty JSON if document doesn't exist
          }
        } catch (error) {
          console.error("Error fetching document from Firestore:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchJsonData();
  }, [open, collectionPath, docId]);

  const handleEditorChange = (newValue) => {
    setJsonContent(newValue);
  };

  const handleSaveClick = async () => {
    try {
      const updatedJson = JSON.parse(jsonContent); // Validate JSON
      const docRef = doc(db, collectionPath, docId);
      await setDoc(docRef, updatedJson); // Save JSON data to Firestore
      alert("JSON data successfully saved to Firestore!");
      handleClose(); // Close the modal after saving
    } catch (error) {
      alert("Invalid JSON format or error saving to Firestore! Please check and try again.");
      console.error("Error saving JSON to Firestore:", error);
    }
  };

  return (
    // <Modal open={open} onClose={handleClose}>
    //   <Box
    //     sx={{
    //       backgroundColor: "white",
    //       padding: "20px",
    //       margin: "10% auto",
    //       width: "80%",
    //     }}
    //   >
    //     <Typography variant="h6" mb={2}>
    //       Edit Projects JSON
    //     </Typography>
    //     <AceEditor
    //       mode="json"
    //       theme="github"
    //       value={jsonContent}
    //       onChange={handleEditorChange}
    //       name="json-editor"
    //       editorProps={{ $blockScrolling: true }}
    //       setOptions={{ useWorker: false }} // Disable web worker for JSON validation
    //       width="100%"
    //       height="400px"
    //       fontSize={16}
    //     />
    //     <Box display="flex" justifyContent="flex-end" mt={2}>
    //       <Button variant="contained" color="primary" onClick={handleSaveClick}>
    //         Save
    //       </Button>
    //       <Button
    //         variant="outlined"
    //         onClick={handleClose}
    //         style={{ marginLeft: "10px" }}
    //       >
    //         Cancel
    //       </Button>
    //     </Box>
    //   </Box>
    // </Modal>
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          backgroundColor: "white",
          padding: "20px",
          margin: "10% auto",
          width: "80%",
        }}
      >
        <Typography variant="h6" mb={2}>
          {isLoading ? "Loading JSON Data..." : "Edit Projects JSON"}
        </Typography>
        {!isLoading && (
          <>
            <AceEditor
              mode="json"
              theme="github"
              value={jsonContent}
              onChange={handleEditorChange}
              name="json-editor"
              editorProps={{ $blockScrolling: true }}
              setOptions={{ useWorker: false }} // Disable web worker for JSON validation
              width="100%"
              height="400px"
              fontSize={16}
            />
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button variant="contained" color="primary" onClick={handleSaveClick}>
                Save
              </Button>
              <Button
                variant="outlined"
                onClick={handleClose}
                style={{ marginLeft: "10px" }}
              >
                Cancel
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default JsonEditorModal;
