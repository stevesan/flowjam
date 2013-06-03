using UnityEngine;
using System.Collections.Generic;

namespace SteveSharp
{
    public class Int2
    {
        public int i, j;

        public Int2( int i, int j )
        {
            this.i = i;
            this.j = j;
        }
    }

    public class Grid<T>
    {
        // Row-major
        private List<T> data = new List<T>();

        private int numCols, numRows;

        public int GetCount() { return numCols * numRows; }

        public void Resize(int numRows, int numCols, T defaultValue )
        {
            this.numCols = numCols;
            this.numRows = numRows;

            data.Clear();

            for( int i = 0; i < numRows; i++ )
                for( int j = 0; j < numCols; j++ )
                    data.Add( defaultValue );
        }

        public int GetFlatIndex( int i, int j )
        {
            return i * numCols + j;
        }

        public void Set( int i, int j, T value )
        {
            data[ GetFlatIndex(i,j) ] = value;
        }

        public T Get( int i, int j )
        {
            return data[ GetFlatIndex(i,j) ];
        }

        public T this[int i, int j]
        {
            get { return Get(i,j); }
            set { Set(i,j, value); }
        }

        // Also allow flat access
        public T this[int id]
        {
            get { return data[id]; }
            set { data[id] = value; }
        }

        public void Clear()
        {
            data.Clear();
            numRows = 0;
            numCols = 0;
        }
    }
}
