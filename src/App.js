import React, { useState, useEffect } from "react";
import axios from "axios";
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
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase"; // <-- Path to your firebase config file

const App = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [timer, setTimer] = useState(900); // 10 minutes in seconds
  const [isRunning, setIsRunning] = useState(false); // Controls if the timer is running
  const [dailyData, setDailyData] = useState({});
  const [form, setForm] = useState({
    fait: "",
    aFaire: "",
    enCours: "",
    pointsBloquants: "",
    meteo: "",
  });
  const [faitPar, setFaitPar] = useState("");
  const [isFormEnabled, setIsFormEnabled] = useState(false); // Disable form until "Fait par" is filled
  const [showThanksMessage, setShowThanksMessage] = useState(false); // For thank-you message after download
  const [isEditorOpen, setIsEditorOpen] = useState(false); // Modal for the JSON editor
  const [projectsData, setProjectsData] = useState(); // Will store the projects data fetched from the backend
  const [globalRemarks, setGlobalRemarks] = useState({});
  const [selectedGlobalRemarkProject, setSelectedGlobalRemarkProject] = useState(null);
  const [globalCompleted, setGlobalCompleted] = useState({});

  const METEO_OPTIONS = ["😎", "🔥", "💀"];
  const fetchProjectsFromFirebase = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "dailyProjects"));

      if (!querySnapshot.empty) {
        const firstDoc = querySnapshot.docs[0]?.data();

        if (firstDoc?.projects) {
          setProjectsData(firstDoc);

          // Initialise les remarques globales
          const initialRemarks = {};
          firstDoc.projects.forEach((project) => {
            initialRemarks[project.name] = { remarque: "", absent: "" };
          });
          setGlobalRemarks(initialRemarks);
        }
      } else {
        console.warn("Aucun document trouvé dans dailyProjects");
      }
    } catch (error) {
      console.error("Erreur lors du fetch Firebase :", error);
    }
  };
  useEffect(() => {


    fetchProjectsFromFirebase();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  const handleTimerChange = (change) => {
    setTimer((prev) => Math.max(prev + change, 0));
  };

  const handleReset = () => {
    setIsRunning(false); // Stop the timer
  };

  const handleSaveGlobalRemark = () => {
    if (!selectedGlobalRemarkProject) return;

    const remarkData = globalRemarks[selectedGlobalRemarkProject];
    const hasContent =
      remarkData.remarque.trim() !== "" || remarkData.absent.trim() !== "";

    setGlobalCompleted((prev) => ({
      ...prev,
      [selectedGlobalRemarkProject]: hasContent,
    }));

    setSelectedGlobalRemarkProject(null);
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };
  const getInitialForm = () => ({
    fait: "",
    aFaire: "",
    enCours: "",
    pointsBloquants: "",
    meteo: "",
  });

  const handleProjectChange = (projectName) => {
    setSelectedProject(projectName);
    setSelectedMember(null);
    setForm(getInitialForm()); // Reset the form
  };

  // Open the JSON editor modal
  const handleOpenEditor = () => {
    setIsEditorOpen(true);
  };

  // Close the JSON editor modal
  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    fetchProjectsFromFirebase(); // Fetch the updated projects data

  };

  // Move to the next member automatically
  const moveToNextMember = () => {
    const project = projectsData.projects.find(
      (p) => p.name === selectedProject
    );
    const currentIndex = project.members.indexOf(selectedMember);
    if (currentIndex + 1 < project.members.length) {
      setSelectedMember(project.members[currentIndex + 1]);
      setForm(getInitialForm()); // Reset the form for the next member
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
          aFaire: "",
          enCours: "",
          pointsBloquants: "",
          meteo: "",
          completed: true,
        },
      },
    }));
    moveToNextMember();
  };


  const handleCopyToClipboard = () => {
    handleReset(); // Stop the timer
    const today = new Date().toLocaleDateString(); // Get today's date
    const textData = Object.entries(dailyData)
      .map(([project, members]) => {
        const membersText = Object.entries(members)
          .map(([member, data]) => {
            if (data.fait === "Absent") {
              return `${member}:\n  Fait: ${data.fait}\n`;
            }
            return `${member}:\n  ✅ Fait: ${data.fait}\n  📌 À faire: ${data.aFaire}\n  🛠️ En cours: ${data.enCours}\n  🚧 Points bloquants: ${data.pointsBloquants}\n  🔥 Météo: ${data.meteo}\n`;

          })
          .join("\n");
        return `- ${project}:\n${membersText}`;
      })
      .join("\n\n");

    let fileContent = `\nDate: ${today}\nFait par: ${faitPar}\n\n${textData}\n`;
    const remarksText = Object.entries(globalRemarks)
      .map(([project, data]) => {
        let content = `- ${project}:\n`;
        if (data.remarque) content += `  📝 Remarque: ${data.remarque}\n`;
        if (data.absent) content += `  ❌ Absent: ${data.absent}\n`;
        return content;
      })
      .join("\n");

    fileContent += `\n\nRemarques globales:\n${remarksText}`;

    if (fileContent.length > 2000) {
      let fileName = "daily.yml";
      let blob = new Blob([fileContent], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      setShowThanksMessage(true);

      // Send file to Discord
      sendToDiscord(fileName, blob);
    } else {
      const formattedText = `\`\`\`yml\n${fileContent}\n\`\`\``;

      // Copy to clipboard
      navigator.clipboard
        .writeText(formattedText)
        .then(() => {
          setShowThanksMessage(true);
        })
        .catch((error) => {
          console.error("Error copying to clipboard:", error);
        });

      // Send text to Discord
      sendTextToDiscord(formattedText);
    }
  };


  // Function to send the file to Discord using webhook
  const sendToDiscord = async (fileName, blob) => {
    const webhookUrl = process.env.REACT_APP_DISCORD_WEBHOOK_URL;

    const formData = new FormData();
    formData.append("file", blob, fileName);

    try {
      await axios.post(webhookUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("File sent to Discord!");
    } catch (error) {
      console.error("Error sending to Discord:", error);
    }
  };

  const sendTextToDiscord = async (content) => {
    const webhookUrl = process.env.REACT_APP_DISCORD_WEBHOOK_URL;

    try {
      await axios.post(webhookUrl, {
        content,
      });
      console.log("Text sent to Discord!");
    } catch (error) {
      console.error("Error sending text to Discord:", error);
    }
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
            <div>
              <Typography variant="subtitle1" style={{ fontWeight: "bold", marginTop: 10 }}>
                Remarques globales
              </Typography>
              {projectsData?.projects?.map((project) => (
                <Box
                  key={`global-${project.name}`}
                  display="flex"
                  alignItems="center"
                  style={{
                    marginBottom: "10px",
                    backgroundColor:
                      selectedGlobalRemarkProject === project.name ? "#f3e5f5" : "inherit",
                    padding: "5px",
                    borderRadius: "5px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e1bee7")
                  }
                  onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    selectedGlobalRemarkProject === project.name ? "#f3e5f5" : "inherit")
                  }
                  onClick={() => {
                    setSelectedProject(null);
                    setSelectedMember(null);
                    setSelectedGlobalRemarkProject(project.name);
                  }}
                >
                  <Typography
                    variant="body2"
                    style={{ cursor: "pointer", marginRight: "10px" }}
                  >
                    {project.name}
                  </Typography>
                  {globalCompleted[project.name] ? (
  <CheckCircleIcon color="success" />
) : (
  <HourglassEmptyIcon color="warning" />
)}
                </Box>
              ))}
            </div>
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

            <Button
              onClick={handleCopyToClipboard}
              style={{ marginTop: "20px", width: "100%" }}
              disabled={!isFormEnabled}>
              COPY / DOWNLOAD
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
                    👤 Prénom : {selectedMember} dans {selectedProject}
                  </Typography>

                  <TextField
                    label="✅ Fait"
                    multiline
                    rows={3}
                    fullWidth
                    value={form.fait}
                    onChange={(e) => {
                      if (isRunning === false) setIsRunning(true);
                      setForm({ ...form, fait: e.target.value });
                    }}
                    style={{ marginBottom: "15px" }}
                    disabled={!isFormEnabled}
                  />

                  <TextField
                    label="📌 À faire"
                    multiline
                    rows={3}
                    fullWidth
                    value={form.aFaire}
                    onChange={(e) => setForm({ ...form, aFaire: e.target.value })}
                    style={{ marginBottom: "15px" }}
                    disabled={!isFormEnabled}
                  />

                  <TextField
                    label="🛠️ En cours"
                    multiline
                    rows={3}
                    fullWidth
                    value={form.enCours}
                    onChange={(e) => setForm({ ...form, enCours: e.target.value })}
                    style={{ marginBottom: "15px" }}
                    disabled={!isFormEnabled}
                  />

                  <TextField
                    label="🚧 Points bloquants"
                    multiline
                    rows={3}
                    fullWidth
                    value={form.pointsBloquants}
                    onChange={(e) => setForm({ ...form, pointsBloquants: e.target.value })}
                    style={{ marginBottom: "15px" }}
                    disabled={!isFormEnabled}
                  />

                  <Box style={{ marginBottom: "15px" }}>
                    <Typography variant="subtitle1" style={{ marginBottom: "5px" }}>
                      🔥 Météo :
                    </Typography>
                    {METEO_OPTIONS.map((emoji) => (
                      <Box key={emoji}>
                        <label>
                          <input
                            type="checkbox"
                            disabled={!isFormEnabled}
                            checked={form.meteo === emoji}
                            onChange={() =>
                              setForm((prev) => ({
                                ...prev,
                                meteo: prev.meteo === emoji ? "" : emoji, // toggle
                              }))
                            }
                          />
                          {" " + emoji}
                        </label>
                      </Box>
                    ))}
                  </Box>
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
              ) : selectedGlobalRemarkProject ? (
                <>
                  <Typography variant="h6">
                    Remarques globales pour {selectedGlobalRemarkProject}
                  </Typography>
                  <TextField
                    label="📝 Remarque"
                    multiline
                    rows={4}
                    fullWidth
                    value={globalRemarks[selectedGlobalRemarkProject]?.remarque || ""}
                    onChange={(e) =>
                      setGlobalRemarks((prev) => ({
                        ...prev,
                        [selectedGlobalRemarkProject]: {
                          ...prev[selectedGlobalRemarkProject],
                          remarque: e.target.value,
                        },
                      }))
                    }
                    style={{ marginBottom: "15px" }}
                    disabled={!isFormEnabled}
                  />
                  <TextField
                    label="❌ Absent"
                    multiline
                    rows={2}
                    fullWidth
                    value={globalRemarks[selectedGlobalRemarkProject]?.absent || ""}
                    onChange={(e) =>
                      setGlobalRemarks((prev) => ({
                        ...prev,
                        [selectedGlobalRemarkProject]: {
                          ...prev[selectedGlobalRemarkProject],
                          absent: e.target.value,
                        },
                      }))
                    }
                    style={{ marginBottom: "15px" }}
                    disabled={!isFormEnabled}
                  />
                  <Grid container spacing={2}>
  <Grid item>
    <Button
      startIcon={<SaveIcon />}
      variant="contained"
      onClick={handleSaveGlobalRemark}
      disabled={!isFormEnabled}
    >
      SAVE
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
        collectionPath="dailyProjects"
        docId="FQ6HYMt3zmSnmManRtwe"
      />
    </div>
  );
};

export default App;
