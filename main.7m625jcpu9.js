// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

import { dotnet } from './_framework/dotnet.js'
import { startCameraLoop } from './camera.js'

const { setModuleImports, getAssemblyExports, getConfig, runMain } = await dotnet
    .withApplicationArguments("start")
    .create();

setModuleImports('main.js', {
    dom: {
        setInnerText: (selector, time) => document.querySelector(selector).innerText = time
    }
});

const config = getConfig();
const exports = await getAssemblyExports(config.mainAssemblyName);

const importButton = document.getElementById('import');
importButton.addEventListener('click', e => {
  e.preventDefault();
  
  // 1. Instantiate file picker
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  
  // 2. Listen for file selection
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      const arrayBuffer = event.target.result;
      const byteArray = new Uint8Array(arrayBuffer); // Dette er dit byte[]
      
      exports.StopwatchSample.ImportDatabase(byteArray); 
    };
    
    reader.readAsArrayBuffer(file);
  });
  
  fileInput.click();
});


const exportButton = document.getElementById('export');
exportButton.addEventListener('click', e => {
  e.preventDefault();

  const byteArray = exports.StopwatchSample.ExportDatabase();
  
  if (!byteArray) return;

  const blob = new Blob([byteArray], { type: 'text/csv;charset=utf-8;' });
  
  // 1. Set up at temporary download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // 2. Configre the filename at trigger the download
  link.href = url;
  link.setAttribute('download', 'database_export.csv');
  document.body.appendChild(link);
  link.click();
  
  // 3. Remove the link
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} );


const moveButton = document.getElementById('move');
function checkMoveStatus() {
  const isEnabled = exports.StopwatchSample.MoveEnabled();
  moveButton.disabled = !isEnabled;
}
checkMoveStatus();
setInterval(checkMoveStatus, 1000);

function handleMoveAction() {
  const newLocation = prompt("Brick location:");  
  if (newLocation === null || newLocation.trim() === "") return;
  exports.StopwatchSample.Move(newLocation);
}

moveButton.addEventListener('click', e => {
  e.preventDefault();
  handleMoveAction();
});


// Method imported in .NET to request moves
globalThis.StopwatchSampleJS = {
  MoveRequested: () => {
    handleMoveAction(); 
  }
};



const canvas = document.getElementById('cameraCanvas');

const camera = await startCameraLoop(exports.StopwatchSample.ProcessFrame, canvas);

// run the C# Main() method and keep the runtime process running and executing further API calls
await runMain();
