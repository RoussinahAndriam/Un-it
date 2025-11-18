<?php

use Illuminate\Console\Scheduling\Schedule;

return function (Schedule $schedule) {
    $schedule->command('recurring:execute-due')->everyMinute();
    
};