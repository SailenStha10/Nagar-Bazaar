require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');
const { scheduleComplaintAssignment } = require('./jobs/complaintAssignmentJob');
const { scheduleDailyPriceMonitoring } = require('./jobs/dailyPriceMonitoring');

connectDB();
scheduleComplaintAssignment();
scheduleDailyPriceMonitoring();

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
