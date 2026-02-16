import { supabase } from './config/database.js';

// New muted/pastel color palette
const NEW_SPRINT_COLORS = [
  '#BFDBFE', // Light Blue
  '#DDD6FE', // Light Purple
  '#FBCFE8', // Light Pink
  '#FCD34D', // Light Amber
  '#A7F3D0', // Light Emerald
  '#A5F3FC', // Light Cyan
  '#FECACA', // Light Red
  '#FED7AA', // Light Orange
  '#C7D2FE', // Light Indigo
  '#99F6E4'  // Light Teal
];

const updateSprintColors = async () => {
  try {
    console.log('🎨 Updating sprint colors to muted/pastel versions...\n');

    // Get all sprints
    const { data: sprints, error: fetchError } = await supabase
      .from('sprints')
      .select('id, sprint_number')
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;

    if (!sprints || sprints.length === 0) {
      console.log('❌ No sprints found in database.');
      process.exit(1);
    }

    console.log(`Found ${sprints.length} sprints to update:\n`);

    // Update each sprint with a new color
    for (let i = 0; i < sprints.length; i++) {
      const sprint = sprints[i];
      const newColor = NEW_SPRINT_COLORS[i % NEW_SPRINT_COLORS.length];

      const { error: updateError } = await supabase
        .from('sprints')
        .update({ color: newColor })
        .eq('id', sprint.id);

      if (updateError) {
        console.error(`❌ Error updating ${sprint.sprint_number}:`, updateError.message);
      } else {
        console.log(`✅ ${sprint.sprint_number} → ${newColor} (Light colors)`);
      }
    }

    console.log(`\n🎉 All sprint colors updated successfully!`);
    console.log(`   Refresh your browser to see the changes.\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
};

updateSprintColors();
