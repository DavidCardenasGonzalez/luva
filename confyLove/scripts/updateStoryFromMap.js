const fs = require('fs');
const path = require('path');

// Paths to the JSON files
const storyMapPath = path.join(__dirname, 'storyMap.json');
const storyPath = path.join(__dirname, 'story.json');

// Read storyMap.json
const storyMapData = JSON.parse(fs.readFileSync(storyMapPath, 'utf8'));

// Read story.json
const storyData = JSON.parse(fs.readFileSync(storyPath, 'utf8'));

// Create a map for quick lookup of storyMap items by id
const storyMapMap = new Map();
storyMapData.forEach(item => {
    storyMapMap.set(item.id, item);
});

// Update story.json with matching ids from storyMap
storyData.forEach(story => {
    if (storyMapMap.has(story.id)) {
        const storyMapItem = storyMapMap.get(story.id);
        // Overwrite any matching parameters
        Object.keys(storyMapItem).forEach(key => {
            story[key] = storyMapItem[key];
        });
    }
});

// Write the updated story.json back to file
fs.writeFileSync(storyPath, JSON.stringify(storyData, null, 2), 'utf8');

console.log('Story.json has been updated with parameters from storyMap.json where ids match.');