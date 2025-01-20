/**
 * SidebarComponent - Task management interface with:
 * - Header: New/Load/Save/Run Task buttons
 * - Left panel: Task tree hierarchy (20% width)
 * - Right panel: Steps list for selected task (80% width)
 * - Bottom: Tabs for step details and actions
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderByPipe } from './order-by.pipe';

// Interface for Task data structure
interface Task {
  id: string;
  name: string;
  children?: Task[];
}

// Interface for Step data structure
interface Step {
  id: string;
  taskId: string;
  name: string;
  description: string;
  action: string;
  order: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatExpansionModule,
    MatListModule,
    MatTabsModule,
    MatIconModule,
    OrderByPipe
  ],
  template: `
    <div class="sidebar-container">
      <!-- Header with task operation buttons -->
      <header class="header-menu">
        <button mat-raised-button color="primary" (click)="newTask()">
          <mat-icon>add</mat-icon> New Task
        </button>
        <button mat-raised-button color="accent" (click)="loadTask()">
          <mat-icon>upload_file</mat-icon> Load Task
        </button>
        <button mat-raised-button color="accent" (click)="saveTask()">
          <mat-icon>save</mat-icon> Save Task
        </button>
        <button mat-raised-button color="warn" (click)="runTask()">
          <mat-icon>play_arrow</mat-icon> Run Task
        </button>
        <button mat-raised-button color="warn" (click)="runFromStep()">
          <mat-icon>skip_next</mat-icon> Run from Step
        </button>
      </header>

      <!-- Main content area -->
      <div class="content-container">
        <!-- Left panel - Task tree (20% width) -->
        <div class="task-tree-panel">
          <h3>Task Library</h3>
          <mat-accordion>
            <mat-expansion-panel *ngFor="let task of tasks">
              <mat-expansion-panel-header (click)="selectTask(task)">
                <mat-panel-title>{{task.name}}</mat-panel-title>
              </mat-expansion-panel-header>
              <div *ngIf="task.children">
                <div *ngFor="let child of task.children" class="subtask" (click)="selectTask(child)">
                  {{child.name}}
                </div>
              </div>
            </mat-expansion-panel>
          </mat-accordion>
        </div>

        <!-- Right panel - Steps list (80% width) -->
        <div class="steps-panel">
          <h3>Steps for {{selectedTask?.name || 'Selected Task'}}</h3>
          <mat-list *ngIf="filteredSteps.length > 0">
            <mat-list-item 
              *ngFor="let step of filteredSteps | orderBy:'order'"
              (click)="selectStep(step)"
              [class.selected]="selectedStep?.id === step.id"
            >
              <div class="step-item">
                <span class="step-number">{{step.order}}.</span>
                <div class="step-content">
                  <h4>{{step.name}}</h4>
                  <p>{{step.description}}</p>
                </div>
              </div>
            </mat-list-item>
          </mat-list>
          
          <div *ngIf="filteredSteps.length === 0 && selectedTask" class="no-steps">
            No steps found for this task. Create steps after selecting a task.
          </div>
          <div *ngIf="!selectedTask" class="no-selection">
            Select a task from the left panel to view its steps.
          </div>
        </div>
      </div>

      <!-- Bottom tabs for step details -->
      <div class="bottom-tabs">
        <mat-tab-group>
          <mat-tab label="Step Object Description">
            <div class="tab-content">
              <h4 *ngIf="selectedStep">Details for: {{selectedStep.name}}</h4>
              <pre *ngIf="selectedStep">{{getStepObjectDetails(selectedStep) | json}}</pre>
              <p *ngIf="!selectedStep">Select a step to view object details</p>
            </div>
          </mat-tab>
          <mat-tab label="Step Action Description">
            <div class="tab-content">
              <h4 *ngIf="selectedStep">Action for: {{selectedStep.name}}</h4>
              <p><strong>Action:</strong> {{selectedStep?.action}}</p>
              <p><strong>Execution Notes:</strong> This step will automate the specified action in the browser.</p>
              <p *ngIf="!selectedStep">Select a step to view action details</p>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      display: flex;
      flex-direction: column;
      height: 100vh; /* Full height of sidebar */
      min-width: 300px;
      max-width: 400px;
      box-sizing: border-box;
      border-right: 1px solid #e0e0e0;
      background-color: white;
    }

    .header-menu {
      padding: 8px;
      background-color: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .content-container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .task-tree-panel {
      width: 20%;
      padding: 16px;
      border-right: 1px solid #e0e0e0;
      overflow-y: auto;
    }

    .steps-panel {
      width: 80%;
      padding: 16px;
      overflow-y: auto;
    }

    .bottom-tabs {
      border-top: 1px solid #e0e0e0;
      min-height: 180px;
    }

    .tab-content {
      padding: 16px;
    }

    .step-item {
      display: flex;
      width: 100%;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
    }

    .step-item:hover {
      background-color: #f9f9f9;
    }

    .step-item.selected {
      background-color: #e3f2fd;
    }

    .step-number {
      min-width: 24px;
      font-weight: bold;
      margin-right: 8px;
      color: rgba(0,0,0,0.54);
    }

    .step-content h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
    }

    .step-content p {
      margin: 0;
      font-size: 12px;
      color: rgba(0,0,0,0.6);
    }

    .no-steps, .no-selection {
      color: rgba(0,0,0,0.54);
      padding: 16px;
      text-align: center;
    }

    h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: rgba(0,0,0,0.87);
    }

    .subtask {
      padding: 8px 16px;
      cursor: pointer;
    }

    .subtask:hover {
      background-color: #f5f5f5;
    }

    pre {
      background-color: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }
  `]
})
export class SidebarComponent implements OnInit {
  // Sample task data
  tasks: Task[] = [
    {
      id: 'task1',
      name: 'User Registration',
      children: [
        { id: 'task1-1', name: 'Open Registration Page' },
        { id: 'task1-2', name: 'Fill Registration Form' },
        { id: 'task1-3', name: 'Submit & Verify' }
      ]
    },
    {
      id: 'task2',
      name: 'Product Checkout',
      children: [
        { id: 'task2-1', name: 'Add to Cart' },
        { id: 'task2-2', name: 'Enter Shipping Details' },
        { id: 'task2-3', name: 'Process Payment' }
      ]
    }
  ];

  // Sample step data
  steps: Step[] = [
    {
      id: 'step1',
      taskId: 'task1-1',
      name: 'Navigate to Signup',
      description: 'Go to registration page from homepage',
      action: 'Click on "Sign Up" button in navigation bar',
      order: 1
    },
    {
      id: 'step2',
      taskId: 'task1-2',
      name: 'Enter Name',
      description: 'Input user full name',
      action: 'Type text in "Full Name" input field',
      order: 1
    },
    {
      id: 'step3',
      taskId: 'task1-2',
      name: 'Enter Email',
      description: 'Input valid email address',
      action: 'Type text in "Email" input field',
      order: 2
    },
    {
      id: 'step4',
      taskId: 'task1-3',
      name: 'Submit Form',
      description: 'Send registration data',
      action: 'Click on "Register" button at bottom of form',
      order: 1
    }
  ];

  // State management
  selectedTask: Task | null = null;
  selectedStep: Step | null = null;
  filteredSteps: Step[] = [];

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {}

  /**
   * Select a task and filter its steps
   */
  selectTask(task: Task): void {
    this.selectedTask = task;
    this.filteredSteps = this.steps.filter(step => step.taskId === task.id);
    this.selectedStep = this.filteredSteps.length > 0 ? this.filteredSteps[0] : null;
  }

  /**
   * Select a specific step
   */
  selectStep(step: Step): void {
    this.selectedStep = step;
  }

  /**
   * Get detailed object information for a step
   */
  getStepObjectDetails(step: Step): object {
    return {
      id: step.id,
      taskId: step.taskId,
      name: step.name,
      order: step.order,
      type: 'user_interaction',
      status: 'pending',
      created: new Date().toISOString(),
      targetSelector: `#${step.id}-target`
    };
  }

  /**
   * Create new task
   */
  newTask(): void {
    this.snackBar.open('New task creation dialog would open here', 'Close', { duration: 2000 });
    // Implementation would show dialog to configure new task
  }

  /**
   * Load task from storage
   */
  loadTask(): void {
    chrome.storage.sync.get('savedTasks', (data) => {
      if (data.savedTasks && data.savedTasks.length > 0) {
        this.snackBar.open(`Loaded ${data.savedTasks.length} tasks`, 'Close', { duration: 2000 });
      } else {
        this.snackBar.open('No saved tasks found', 'Close', { duration: 2000 });
      }
    });
  }

  /**
   * Save current task to storage
   */
  saveTask(): void {
    if (!this.selectedTask) {
      this.snackBar.open('Select a task first', 'Close', { duration: 2000 });
      return;
    }

    chrome.storage.sync.get('savedTasks', (data) => {
      const tasks = data.savedTasks || [];
      tasks.push({
        id: this.selectedTask!.id,
        name: this.selectedTask!.name,
        steps: this.filteredSteps,
        savedAt: new Date().toISOString()
      });
      chrome.storage.sync.set({ savedTasks: tasks });
      this.snackBar.open(`Task "${this.selectedTask!.name}" saved`, 'Close', { duration: 2000 });
    });
  }

  /**
   * Run entire selected task
   */
  runTask(): void {
    if (this.selectedTask) {
      this.snackBar.open(`Running task: ${this.selectedTask.name}`, 'Close', { duration: 2000 });
      // Implementation would send message to content script to execute steps
    } else {
      this.snackBar.open('Select a task to run', 'Close', { duration: 2000 });
    }
  }

  /**
   * Run task from selected step
   */
  runFromStep(): void {
    if (this.selectedStep && this.selectedTask) {
      this.snackBar.open(`Running from step ${this.selectedStep.order}`, 'Close', { duration: 2000 });
      // Implementation would send message to content script to start from selected step
    } else {
      this.snackBar.open('Select a step first', 'Close', { duration: 2000 });
    }
  }
}
    