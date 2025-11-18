<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\RecurringOperationController;
use Illuminate\Console\Command;

class ExecuteDueRecurringOperations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:execute-due-recurring-operations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Execute due recurring operations';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $controller = new RecurringOperationController();
        $response = $controller->executeDueOperations();
        
        $data = $response->getData();
        $this->info("Opérations exécutées: {$data->executed_count}/{$data->total_due}");
        
        if (!empty($data->errors)) {
            foreach ($data->errors as $error) {
                $this->error($error);
            }
        }
    }
}
