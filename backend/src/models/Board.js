import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    columns: [
      {
        id: String,
        title: String,
        cards: [
          {
            id: String,
            title: String,
            description: String,
            assignee: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User'
            },
            dueDate: Date,
            priority: {
              type: String,
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              default: 'MEDIUM'
            }
          }
        ]
      }
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE'
    }
  },
  { timestamps: true }
);

const Board = mongoose.model('Board', boardSchema);

export default Board;
