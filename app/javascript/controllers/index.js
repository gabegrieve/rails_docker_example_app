import { application } from "controllers/application"

import ReadingTimeController from "controllers/reading_time_controller"
application.register("reading-time", ReadingTimeController)

import CopyCodeController from "controllers/copy_code_controller"
application.register("copy-code", CopyCodeController)
