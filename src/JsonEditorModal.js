import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button } from "@mui/material";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";

const JsonEditorModal = ({ open, handleClose, jsonData, handleSave }) => {
  const [jsonContent, setJsonContent] = useState(""); // Initialize as an empty string

  // Effect to update jsonContent when jsonData or modal open state changes
  useEffect(() => {
    if (open && jsonData) {
      setJsonContent(JSON.stringify(jsonData, null, 2)); // Prettify JSON
    }
  }, [open, jsonData]);

  const handleEditorChange = (newValue) => {
    setJsonContent(newValue);
  };

  const handleSaveClick = () => {
    try {
      const updatedJson = JSON.parse(jsonContent); // Validate JSON
      handleSave(updatedJson);
    } catch (error) {
      alert("Invalid JSON format! Please correct and try again.");
    }
  };

  return (
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
          Edit Projects JSON
        </Typography>
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
      </Box>
    </Modal>
  );
};

export default JsonEditorModal;
