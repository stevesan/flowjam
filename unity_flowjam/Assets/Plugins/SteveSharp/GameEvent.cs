
using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace SteveSharp
{
    public class GameEvent
    {
        public delegate void Handler(GameObject source);

        Dictionary<GameObject, Handler> handlers = new Dictionary<GameObject, Handler>();

        public void AddHandler( GameObject obj, Handler handler )
        {
            handlers.Add( obj, handler );
        }

        public void RemoveHandler( GameObject obj )
        {
            handlers.Remove( obj );
        }

        public void Trigger(GameObject src)
        {
            foreach( GameObject obj in handlers.Keys )
            {
                if( obj != null )
                    handlers[obj](src);
                // TODO we should really remove the null object from the dictionary
            }
        }

        public void Trigger( MonoBehaviour comp )
        {
            Trigger( comp.gameObject );
        }
        
    }
}
