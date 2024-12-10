import React, { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  Button,
  TextField,
  Paper,
  Divider,
  Box,
  Alert,
  AppBar,
  Toolbar,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import "./App.css"; // Optional CSS file for custom tweaks
import JsonEditorModal from "./JsonEditorModal"; // Import the modal component

const App = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [isRunning, setIsRunning] = useState(false); // Controls if the timer is running
  const [dailyData, setDailyData] = useState({});
  const [form, setForm] = useState({
    fait: "",
    remarques: "",
    aFaire: "",
  });
  const [faitPar, setFaitPar] = useState("");
  const [isFormEnabled, setIsFormEnabled] = useState(false); // Disable form until "Fait par" is filled
  const [showThanksMessage, setShowThanksMessage] = useState(false); // For thank-you message after download
  const [isEditorOpen, setIsEditorOpen] = useState(false); // Modal for the JSON editor
  const [projectsData, setProjectsData] = useState(); // Will store the projects data fetched from the backend

  // Fetch projects data from the backend
  useEffect(() => {
    fetch("https://everbloo-daily-back.vercel.app/api/projects")
      .then((response) => response.json())
      .then((data) => {
        console.log("DATA", data);
        setProjectsData(data);
      })
      .catch((error) => {
        console.log(error);
        console.error("Error fetching projects data:", error);
      });
  }, []);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsRunning(false); // Stop the timer when it reaches 0
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  const handleTimerChange = (change) => {
    setTimer((prev) => Math.max(prev + change, 0));
  };

  const handleReset = () => {
    setTimer(600); // Reset to 10 minutes
    setIsRunning(false); // Stop the timer
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleProjectChange = (projectName) => {
    setSelectedProject(projectName);
    setSelectedMember(null);
    setForm({ fait: "", remarques: "", aFaire: "" }); // Reset the form
    handleReset(); // Reset the timer and stop it
  };

  // Open the JSON editor modal
  const handleOpenEditor = () => {
    setIsEditorOpen(true);
  };

  // Close the JSON editor modal
  const handleCloseEditor = () => {
    setIsEditorOpen(false);
  };

  // Save the updated JSON to the backend
  const handleSaveJson = (updatedJson) => {
    fetch("https://everbloo-daily-back.vercel.app/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedJson),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Projects updated:", data);
        setProjectsData(updatedJson); // Update the state with the new projects
        setIsEditorOpen(false); // Close the modal
      })
      .catch((error) => {
        console.error("Error saving projects data:", error);
      });
  };

  // Move to the next member automatically
  const moveToNextMember = () => {
    const project = projectsData.projects.find(
      (p) => p.name === selectedProject
    );
    const currentIndex = project.members.indexOf(selectedMember);
    if (currentIndex + 1 < project.members.length) {
      setSelectedMember(project.members[currentIndex + 1]);
      setForm({ fait: "", remarques: "", aFaire: "" });
    }
  };

  const handleSave = () => {
    setDailyData((prev) => ({
      ...prev,
      [selectedProject]: {
        ...prev[selectedProject],
        [selectedMember]: { ...form, completed: true },
      },
    }));
    moveToNextMember();
  };

  const handleAbsent = () => {
    setDailyData((prev) => ({
      ...prev,
      [selectedProject]: {
        ...prev[selectedProject],
        [selectedMember]: {
          fait: "Absent",
          remarques: "",
          aFaire: "",
          completed: true,
        },
      },
    }));
    moveToNextMember();
  };

  // const handleDownload = () => {
  //   const today = new Date().toLocaleDateString(); // Get today's date
  //   const textData = Object.entries(dailyData)
  //     .map(([project, members]) => {
  //       const membersText = Object.entries(members)
  //         .map(([member, data]) => {
  //           if(data.fait === "Absent"){
  //             return `${member}:\n  Fait: ${data.fait}\n`;
  //           }
  //           return `${member}:\n  Fait: ${data.fait}\n  Remarques: ${data.remarques}\n  A faire: ${data.aFaire}\n`;
  //         })
  //         .join("\n");
  //       return `- ${project}:\n${membersText}`;
  //     })
  //     .join("\n\n");
  //   const fileContent = `\nDate: ${today}\nFait par: ${faitPar}\n\n${textData}\n`;
  //   let blob = null;
  //   let fileName = "daily.txt";

  //   if (fileContent.length < 2000) {
  //     fileName = "daily.txt";
  //     blob = new Blob([`\`\`\`yml\n${fileContent}\n\`\`\``], {
  //       type: "text/plain",
  //     });
  //   } else {
  //     fileName = "daily.yml";
  //     blob = new Blob([fileContent], { type: "text/plain" });
  //   }
  //   const link = document.createElement("a");
  //   link.href = URL.createObjectURL(blob);
  //   link.download = fileName;
  //   link.click();

  //   // Show thank-you message after download
  //   setShowThanksMessage(true);
  // };
const handleCopyToClipboard = () => {
    const today = new Date().toLocaleDateString(); // Get today's date
    const textData = Object.entries(dailyData)
      .map(([project, members]) => {
        const membersText = Object.entries(members)
          .map(([member, data]) => {
            if (data.fait === "Absent") {
              return `${member}:\n  Fait: ${data.fait}\n`;
            }
            return `${member}:\n  Fait: ${data.fait}\n  Remarques: ${data.remarques}\n  A faire: ${data.aFaire}\n`;
          })
          .join("\n");
        return `- ${project}:\n${membersText}`;
      })
      .join("\n\n");
  
    const fileContent = `\`\`\`yml\nDate: ${today}\nFait par: ${faitPar}\n\n${textData}\n\`\`\``;
  
    // Copy the content to clipboard
    navigator.clipboard
      .writeText(fileContent)
      .then(() => {
        // Show thank-you message after copying
        setShowThanksMessage(true);
      })
      .catch((error) => {
        console.error("Error copying to clipboard:", error);
      });
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const isMemberCompleted = (project, member) => {
    return (
      dailyData[project] &&
      dailyData[project][member] &&
      dailyData[project][member].completed
    );
  };

  const isProjectCompleted = (project) => {
    const members =
      projectsData?.projects.find((p) => p.name === project)?.members || [];
    return members.every((member) => isMemberCompleted(project, member));
  };

  const handleFaitParSubmit = () => {
    if (faitPar.trim()) {
      setIsFormEnabled(true); // Enable the form
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Box sx={{ flexGrow: 1, marginBottom: "10px" }}>
        <AppBar position="static">
          <Toolbar>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
            >
              Everbloo Daily
            </Typography>
            <Button color="inherit" onClick={handleOpenEditor}>
              Edit Members
            </Button>
          </Toolbar>
        </AppBar>
      </Box>

      {/* Main Grid Layout */}
      <Grid container spacing={2}>
        {/* Projects and Timer Column */}
        <Grid item xs={3}>
          <Paper style={{ padding: "20px", height: "100%" }}>
            <Typography variant="h6">Projects</Typography>
            {projectsData?.projects?.map((project) => (
              <div key={project.name} style={{ marginBottom: "10px" }}>
                <Typography
                  variant="subtitle1"
                  onClick={() => handleProjectChange(project.name)}
                  style={{
                    cursor: "pointer",
                    fontWeight:
                      selectedProject === project.name ? "bold" : "normal",
                  }}
                >
                  {project.name}{" "}
                  {isProjectCompleted(project.name) ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <HourglassEmptyIcon color="warning" />
                  )}
                </Typography>
                {project.name === selectedProject && (
                  <div style={{ marginLeft: "20px" }}>
                    {project.members.map((member) => (
                      <Box
                        key={member}
                        display="flex"
                        alignItems="center"
                        style={{
                          marginBottom: "10px",
                          backgroundColor:
                            selectedMember === member ? "#e0f7fa" : "inherit",
                          padding: "5px",
                          borderRadius: "5px",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#b2ebf2")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            selectedMember === member ? "#e0f7fa" : "inherit")
                        }
                        onClick={() => setSelectedMember(member)}
                      >
                        <Typography
                          variant="body2"
                          style={{ cursor: "pointer", marginRight: "10px" }}
                        >
                          {member}
                        </Typography>
                        {isMemberCompleted(project.name, member) ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <HourglassEmptyIcon color="warning" />
                        )}
                      </Box>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Divider style={{ margin: "20px 0" }} />
            <Typography variant="h6" align="center">
              Timer: {formatTime(timer)}
            </Typography>
            <Grid
              container
              spacing={1}
              justifyContent="center"
              style={{ marginTop: "10px" }}
            >
              <Grid item>
                <Button
                  variant="contained"
                  onClick={() => handleTimerChange(300)}
                  disabled={!isFormEnabled}
                >
                  +5MIN
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  onClick={() => handleTimerChange(-300)}
                  disabled={!isFormEnabled}
                >
                  -5MIN
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  onClick={handleReset}
                  disabled={!isFormEnabled}
                >
                  RESET
                </Button>
              </Grid>
            </Grid>

            {/* Timer Control Buttons */}
            <Grid
              container
              spacing={1}
              justifyContent="center"
              style={{ marginTop: "10px" }}
            >
              <Grid item>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleStart}
                  disabled={!isFormEnabled || isRunning}
                >
                  START
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleStop}
                  disabled={!isFormEnabled || !isRunning}
                >
                  STOP
                </Button>
              </Grid>
            </Grid>

            // <Button
            //   onClick={handleDownload}
            //   style={{ marginTop: "20px", width: "100%" }}
            //   disabled={!isFormEnabled}
            // >
            //   DOWNLOAD
            // </Button>
            <Button
              onClick={handleCopyToClipboard}
              style={{ marginTop: "20px", width: "100%" }}
              disabled={!isFormEnabled}>
              COPY TO CLIPBOARD
            </Button>
          </Paper>
        </Grid>

        {/* Form Column */}
        <Grid item xs={9}>
          {showThanksMessage ? (
            <Alert severity="success">
              Thanks for your time and have a good day!
            </Alert>
          ) : (
            <Paper style={{ padding: "20px" }}>
              {selectedProject && selectedMember ? (
                <>
                  <Typography variant="h6">
                    Fill Daily for {selectedMember} in {selectedProject}
                  </Typography>
                  <TextField
                    label="Fait"
                    multiline
                    rows={4}
                    fullWidth
                    value={form.fait}
                    onChange={(e) => {
                      if (isRunning == false) {
                        setIsRunning(true);
                      }
                      setForm({ ...form, fait: e.target.value });
                    }}
                    style={{ marginBottom: "15px" }}
                    disabled={!isFormEnabled}
                  />
                  <TextField
                    label="Remarques"
                    multiline
                    rows={4}
                    fullWidth
                    value={form.remarques}
                    onChange={(e) =>
                      setForm({ ...form, remarques: e.target.value })
                    }
                    style={{ marginBottom: "15px" }}
                    disabled={!isFormEnabled}
                  />
                  <TextField
                    label="A faire"
                    multiline
                    rows={4}
                    fullWidth
                    value={form.aFaire}
                    onChange={(e) =>
                      setForm({ ...form, aFaire: e.target.value })
                    }
                    style={{ marginBottom: "15px" }}
                    disabled={!isFormEnabled}
                  />
                  <Grid container spacing={2}>
                    <Grid item>
                      <Button
                        startIcon={<SaveIcon />}
                        variant="contained"
                        onClick={handleSave}
                        disabled={!isFormEnabled}
                      >
                        SAVE
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button
                        variant="outlined"
                        onClick={handleAbsent}
                        disabled={!isFormEnabled}
                      >
                        ABSENT
                      </Button>
                    </Grid>
                  </Grid>
                </>
              ) : (
                <Typography variant="h6" align="center">
                  Please select a project and a member to fill the daily form.
                </Typography>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Fait par Input Section */}
      <Grid
        container
        spacing={2}
        justifyContent="center"
        style={{ marginTop: "20px" }}
      >
        <Grid item xs={6}>
          <TextField
            label="Fait par"
            fullWidth
            value={faitPar}
            onChange={(e) => setFaitPar(e.target.value)}
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            onClick={handleFaitParSubmit}
            disabled={isFormEnabled || !faitPar.trim()}
          >
            Submit
          </Button>
        </Grid>
      </Grid>
      <JsonEditorModal
        open={isEditorOpen}
        handleClose={handleCloseEditor}
        jsonData={projectsData}
        handleSave={handleSaveJson}
      />
    </div>
  );
};

export default App;
