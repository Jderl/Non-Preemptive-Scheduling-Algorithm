// Function to update input fields dynamically based on the number of jobs
function updateInputFields() {
  const numJobs = parseInt(document.getElementById("numJobs").value, 10);

  // Validate the number of jobs
  if (isNaN(numJobs) || numJobs < 1 || !Number.isInteger(numJobs)) {
    showAlert("Please enter a valid number of jobs (minimum 1).", "danger");
    return;
  }

  // Enable input fields and update placeholders
  document.getElementById("arrivalTimes").disabled = false;
  document.getElementById("burstTimes").disabled = false;
  document.getElementById("priorityValues").disabled = false;

  document.getElementById(
    "arrivalTimes"
  ).placeholder = `Enter ${numJobs} arrival times (comma-separated)`;
  document.getElementById(
    "burstTimes"
  ).placeholder = `Enter ${numJobs} burst times (comma-separated)`;
  document.getElementById(
    "priorityValues"
  ).placeholder = `Enter ${numJobs} priority values (comma-separated)`;
}

// Function to calculate scheduling
function calculateScheduling() {
  const numJobs = parseInt(document.getElementById("numJobs").value, 10);

  if (isNaN(numJobs) || numJobs < 1 || !Number.isInteger(numJobs)) {
    showAlert(
      "Please set a valid number of jobs before calculating.",
      "danger"
    );
    return;
  }

  const arrivalTimesInput = document
    .getElementById("arrivalTimes")
    .value.trim();
  const burstTimesInput = document.getElementById("burstTimes").value.trim();
  const priorityValuesInput = document
    .getElementById("priorityValues")
    ?.value.trim();

  // Check if inputs are empty
  if (
    !arrivalTimesInput ||
    !burstTimesInput ||
    (priorityValuesInput && priorityValuesInput.trim() === "")
  ) {
    showAlert(
      "Arrival times, burst times, and priority values cannot be empty.",
      "danger"
    );
    return;
  }

  const arrivalTimes = parseInput(arrivalTimesInput);
  const burstTimes = parseInput(burstTimesInput);
  const priorityValues = priorityValuesInput
    ? parseInput(priorityValuesInput)
    : [];

  // Validate the input lengths
  if (
    arrivalTimes.length !== numJobs ||
    burstTimes.length !== numJobs ||
    (priorityValues.length !== numJobs && priorityValues.length > 0)
  ) {
    showAlert(
      `Please provide exactly ${numJobs} arrival, burst, and priority values.`,
      "danger"
    );
    return;
  }

  // Validate that all inputs are non-negative integers
  if (
    !isValidArray(arrivalTimes, "arrival") ||
    !isValidArray(burstTimes, "burst") ||
    (priorityValues.length && !isValidArray(priorityValues, "priority"))
  ) {
    return;
  }

  const selectedAlgorithm = document.querySelector(
    'input[name="scheduling"]:checked'
  ).value;

  if (!selectedAlgorithm) {
    showAlert("Please select a scheduling algorithm.", "danger");
    return;
  }

  // Proceed with scheduling logic based on selected algorithm
  if (selectedAlgorithm === "fcfs") {
    performFCFS(arrivalTimes, burstTimes);
  } else if (selectedAlgorithm === "sjf") {
    performSJF(arrivalTimes, burstTimes);
  } else if (selectedAlgorithm === "npp") {
    performNPP(arrivalTimes, burstTimes, priorityValues);
  } else {
    showAlert("Invalid scheduling algorithm selected.", "danger");
  }
}

// Function to parse comma or space-separated input into an array of numbers
function parseInput(input) {
  return input
    .split(/[,\s]+/)
    .map((value) => parseInt(value, 10))
    .filter((value) => !isNaN(value));
}

// Function to validate an array of inputs
function isValidArray(arr, type) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < 0 || isNaN(arr[i])) {
      showAlert(
        `Invalid ${type} time at position ${
          i + 1
        }. Only non-negative numbers are allowed.`,
        "danger"
      );
      return false;
    }
  }
  return true;
}

// Function to perform First-Come, First-Served (FCFS) scheduling
function performFCFS(arrivalTimes, burstTimes) {
  const numJobs = arrivalTimes.length;

  let completionTimes = [];
  let turnAroundTimes = [];
  let waitingTimes = [];
  let ganttChart = [];
  let currentTime = 0;

  for (let i = 0; i < numJobs; i++) {
    if (currentTime < arrivalTimes[i]) {
      currentTime = arrivalTimes[i];
    }
    ganttChart.push(`P${i + 1}`);
    currentTime += burstTimes[i];
    completionTimes.push(currentTime);
    turnAroundTimes.push(completionTimes[i] - arrivalTimes[i]);
    waitingTimes.push(turnAroundTimes[i] - burstTimes[i]);
  }

  displayResults(
    arrivalTimes,
    burstTimes,
    completionTimes,
    turnAroundTimes,
    waitingTimes,
    ganttChart
  );
}

// Function to perform Shortest Job First (SJF) scheduling
function performSJF(arrivalTimes, burstTimes) {
  const numJobs = arrivalTimes.length;
  let completionTimes = new Array(numJobs).fill(0);
  let turnAroundTimes = new Array(numJobs).fill(0);
  let waitingTimes = new Array(numJobs).fill(0);
  let ganttChart = [];

  let remainingJobs = [...Array(numJobs).keys()];
  let currentTime = 0;

  // Track the execution order of the jobs
  let executionOrder = [];

  while (remainingJobs.length > 0) {
    const availableJobs = remainingJobs.filter(
      (job) => arrivalTimes[job] <= currentTime
    );

    if (availableJobs.length === 0) {
      currentTime++;
      continue;
    }

    // Find the job with the shortest burst time
    const nextJob = availableJobs.reduce((minJob, job) =>
      burstTimes[job] < burstTimes[minJob] ? job : minJob
    );

    // Record the job in the execution order and Gantt chart
    ganttChart.push(`P${nextJob + 1}`);
    executionOrder.push(nextJob);

    currentTime += burstTimes[nextJob];
    completionTimes[nextJob] = currentTime;
    turnAroundTimes[nextJob] = completionTimes[nextJob] - arrivalTimes[nextJob];
    waitingTimes[nextJob] = turnAroundTimes[nextJob] - burstTimes[nextJob];

    remainingJobs = remainingJobs.filter((job) => job !== nextJob);
  }

  // Now we need to correctly display the results based on the execution order
  let sortedCompletionTimes = [];
  let sortedGanttChart = [];
  executionOrder.forEach((jobIndex) => {
    sortedCompletionTimes.push(completionTimes[jobIndex]);
    sortedGanttChart.push(ganttChart[executionOrder.indexOf(jobIndex)]);
  });

  // Display the results with the correct sorted Gantt chart and completion times
  displayResults(
    arrivalTimes,
    burstTimes,
    sortedCompletionTimes,
    turnAroundTimes,
    waitingTimes,
    sortedGanttChart
  );
}

// Function to perform Non-Preemptive Priority scheduling
function performNPP(arrivalTimes, burstTimes, priorityValues) {
  const numJobs = arrivalTimes.length;
  let completionTimes = new Array(numJobs).fill(0);
  let turnAroundTimes = new Array(numJobs).fill(0);
  let waitingTimes = new Array(numJobs).fill(0);
  let ganttChart = [];

  let remainingJobs = [...Array(numJobs).keys()];
  let currentTime = 0;

  // Track the execution order of the jobs
  let executionOrder = [];

  while (remainingJobs.length > 0) {
    // Filter jobs that have arrived
    const availableJobs = remainingJobs.filter(
      (job) => arrivalTimes[job] <= currentTime
    );

    if (availableJobs.length === 0) {
      currentTime++;
      continue;
    }

    // Sort the available jobs by priority (ascending order)
    const nextJob = availableJobs.reduce((minJob, job) =>
      priorityValues[job] < priorityValues[minJob] ? job : minJob
    );

    // Execute the job with the highest priority
    ganttChart.push(`P${nextJob + 1}`);
    executionOrder.push(nextJob);

    currentTime += burstTimes[nextJob];
    completionTimes[nextJob] = currentTime;
    turnAroundTimes[nextJob] = completionTimes[nextJob] - arrivalTimes[nextJob];
    waitingTimes[nextJob] = turnAroundTimes[nextJob] - burstTimes[nextJob];

    remainingJobs = remainingJobs.filter((job) => job !== nextJob);
  }

  // Display results with the correct sorted Gantt chart and completion times
  let sortedCompletionTimes = [];
  let sortedGanttChart = [];
  executionOrder.forEach((jobIndex) => {
    sortedCompletionTimes.push(completionTimes[jobIndex]);
    sortedGanttChart.push(ganttChart[executionOrder.indexOf(jobIndex)]);
  });

  displayResults(
    arrivalTimes,
    burstTimes,
    sortedCompletionTimes,
    turnAroundTimes,
    waitingTimes,
    sortedGanttChart
  );
}

// Function to calculate and display CPU Utilization
function displayCPUUtilization(burstTimes, completionTimes) {
  const totalBurstTime = burstTimes.reduce((acc, time) => acc + time, 0);
  const totalTime = completionTimes[completionTimes.length - 1];
  const cpuUtilization = ((totalBurstTime / totalTime) * 100).toFixed(2);

  document.getElementById(
    "cpuUtilization"
  ).innerText = `CPU Utilization: ${cpuUtilization}%`;
}

// Function to display results with detailed explanations in the requested format
function displayResults(
  arrivalTimes,
  burstTimes,
  completionTimes,
  turnAroundTimes,
  waitingTimes,
  ganttChart
) {
  const resultsTable = document.getElementById("resultsTableBody");
  resultsTable.innerHTML = "";

  let totalTurnaroundTime = 0;
  let totalWaitingTime = 0;

  // Fill in the main results table
  for (let i = 0; i < arrivalTimes.length; i++) {
    const row = `<tr>
      <td>P${i + 1}</td>
      <td>${arrivalTimes[i]}</td>
      <td>${burstTimes[i]}</td>
      <td>${completionTimes[i]}</td>
    </tr>`;
    resultsTable.innerHTML += row;

    // Calculate total turnaround time and waiting time for averages
    totalTurnaroundTime += turnAroundTimes[i];
    totalWaitingTime += waitingTimes[i];
  }

  // Calculate average turnaround time and average waiting time
  const avgTurnaroundTime = totalTurnaroundTime / arrivalTimes.length;
  const avgWaitingTime = totalWaitingTime / arrivalTimes.length;

  // Display Turnaround Time Table with detailed explanations
  const turnaroundTimeTable = document.getElementById("turnaroundTimeBody");
  turnaroundTimeTable.innerHTML = "";
  for (let i = 0; i < arrivalTimes.length; i++) {
    const row = `<tr>
      <td>P${i + 1}</td>
      <td>${completionTimes[i]} - ${arrivalTimes[i]}</td>
      <td>${turnAroundTimes[i]}</td>
    </tr>`;
    turnaroundTimeTable.innerHTML += row;
  }

  // Add total and average for Turnaround Time in the requested format
  turnaroundTimeTable.innerHTML += `
    <tr>
      <td colspan="2"><strong>Total Turnaround Time:</strong></td>
      <td>${totalTurnaroundTime}</td>
    </tr>
    <tr>
      <td colspan="2"><strong>Average Turnaround Time:</strong></td>
      <td>${totalTurnaroundTime} / ${
    arrivalTimes.length
  } = ${avgTurnaroundTime.toFixed(2)}</td>
    </tr>`;

  document.getElementById("turnaroundTimeTable").style.display = "block";

  // Display Waiting Time Table with detailed explanations
  const waitingTimeTable = document.getElementById("waitingTimeBody");
  waitingTimeTable.innerHTML = "";
  for (let i = 0; i < arrivalTimes.length; i++) {
    const row = `<tr>
      <td>P${i + 1}</td>
      <td>${turnAroundTimes[i]} - ${burstTimes[i]}</td>
      <td>${waitingTimes[i]}</td>
    </tr>`;
    waitingTimeTable.innerHTML += row;
  }

  // Add total and average for Waiting Time in the requested format
  waitingTimeTable.innerHTML += `
    <tr>
      <td colspan="2"><strong>Total Waiting Time:</strong></td>
      <td>${totalWaitingTime}</td>
    </tr>
    <tr>
      <td colspan="2"><strong>Average Waiting Time:</strong></td>
      <td>${totalWaitingTime} / ${
    arrivalTimes.length
  } = ${avgWaitingTime.toFixed(2)}</td>
    </tr>`;

  document.getElementById("waitingTimeTable").style.display = "block";

  // Gantt Chart display
  const ganttHeader = document.getElementById("ganttHeaderRow");
  const ganttTimeRow = document.getElementById("ganttTimeRow");

  ganttHeader.innerHTML =
    `<th>Start</th>` + ganttChart.map((job) => `<th>${job}</th>`).join("");

  ganttTimeRow.innerHTML =
    `<td>${arrivalTimes[0]}</td>` +
    completionTimes.map((time) => `<td>${time}</td>`).join("");


    
  document.getElementById("ganttChart").style.display = "block";

  // Display CPU Utilization
  displayCPUUtilization(burstTimes, completionTimes);

  // Display results table
  document.getElementById("results").style.display = "block";
}

// Function to show alert messages
function showAlert(message, type) {
  const alertDiv = document.createElement("div");
  alertDiv.classList.add("alert", `alert-${type}`);
  alertDiv.innerText = message;
  document.body.prepend(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}
