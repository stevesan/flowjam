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
        T[,] data;

        public int numCols { get; private set; }
        public int numRows { get; private set; }

        public int GetCount() { return numCols * numRows; }

        public void Reset(int numRows, int numCols, T defaultValue )
        {
            this.numCols = numCols;
            this.numRows = numRows;

            data = new T[ numRows, numCols ];

            for( int i = 0; i < numRows; i++ )
                for( int j = 0; j < numCols; j++ )
                    data[i,j] = defaultValue;
        }

        public bool IsValid( int i, int j )
        {
            return i >= 0 && j >= 0 && i < numRows && j < numCols;
        }

        public bool IsValid( Int2 p )
        {
            return IsValid( p.i, p.j );
        }

        public int GetFlatIndex( int i, int j )
        {
            return i * numCols + j;
        }

        public void Set( int i, int j, T value )
        {
            if( !Utility.Assert( IsValid(i,j), "Grid.Set: indices out of range" ) )
                return;
            else
                data[i, j] = value;
        }

        public T Get( int i, int j )
        {
            if( !Utility.Assert( IsValid(i,j), "Get.Get: indices out of range, "+i+","+j+" with size "+numRows+","+numCols ) )
                return default(T);
            else
                return data[ i, j ];
        }

        public T Get( int i, int j, T defaultVal )
        {
            if( !IsValid(i,j) )
                return defaultVal;
            else
                return data[ i, j ];
        }

        public T this[int i, int j]
        {
            get { return Get(i,j); }
            set { Set(i,j, value); }
        }

        public T this[int k]
        {
            get { return Get( k / numCols, k % numCols ); }
            set { Set( k / numCols, k % numCols, value ); }
        }

        public void Clear()
        {
            data = null;
            numRows = 0;
            numCols = 0;
        }
    }
}
