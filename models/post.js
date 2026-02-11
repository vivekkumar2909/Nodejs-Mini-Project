import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true
        },

        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        date: {
            type: Date,
            default: Date.now
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
