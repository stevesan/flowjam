
using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace SteveSharp
{
    public class ControllerStack
    {
        public static ControllerStack main = null;

        Stack<GameObject> stack;

        public void Push( GameObject controller )
        {
            if( stack.Count > 0 )
                stack.Peek().SendMessage( "OnControllerDisable" );
            stack.Push(controller);
            controller.SendMessage( "OnControllerEnable" );
        }

        public void Pop( GameObject controller )
        {
            if( controller != stack.Peek() )
                Debug.LogError("Controller "+controller.name+" tried to remove itself out of its turn");
            else
            {
                if( stack.Peek() != null )
                    stack.Peek().SendMessage("OnControllerDisable");
                stack.Pop();
                if( stack.Count > 0 )
                    stack.Peek().SendMessage("OnControllerEnable");
            }
        }
    }
}
