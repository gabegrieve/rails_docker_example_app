import { application } from "controllers/application"

import ReadingTimeController from "controllers/reading_time_controller"
application.register("reading-time", ReadingTimeController)
